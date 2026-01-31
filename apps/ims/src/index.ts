/**
 * IMS — Image Manipulation Service
 * Stateless, CDN-friendly. Never serves originals; only derived variants.
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
import { prisma } from "@exibidos/db/client";
import type { ImageMlMetadataData } from "@exibidos/ml";
import type { BlurMode } from "./contracts.js";
import {
  cacheKey,
  memoryCacheGet,
  memoryCacheSet,
  isMemoryCacheEnabled,
} from "./cache.js";
import { logRequest, getMetrics } from "./observability.js";
import { resolveBlurMode } from "./blur-policies.js";
import { parseTransformSpec } from "./parser.js";
import { runPipeline } from "./pipeline.js";
import { fetchFromStorage, isStorageConfigured } from "./storage.js";

const app = Fastify({ logger: true });

async function main() {
  await app.register(cors, { origin: true });

  app.get("/health", async () => ({ status: "ok", service: "@exibidos/ims" }));

  app.get("/metrics", async () => getMetrics());

  /**
   * GET /i/:imageId
   * Query: w, h, fit, fmt, q, v (all optional; v = contract version for cache safety)
   * Returns derived image only. 404 if image missing; 400 if invalid params; 502 if upstream (S3) fails.
   */
  app.get<{
    Params: { imageId: string };
  }>("/i/:imageId", async (request, reply) => {
    const start = Date.now();
    const { imageId } = request.params;
    const query = request.query as Record<string, string | undefined>;

    if (!isStorageConfigured()) {
      logRequest(imageId, { v: 1, fit: "inside", fmt: "jpeg", q: 85 }, "miss", 503, Date.now() - start, request.log);
      return reply.status(503).send({ error: "storage_unavailable" });
    }

    const parsed = parseTransformSpec(query);
    if (!parsed.ok) {
      logRequest(imageId, { v: 1, fit: "inside", fmt: "jpeg", q: 85 }, "miss", 400, Date.now() - start, request.log);
      return reply.status(400).send({ error: parsed.code, message: parsed.message });
    }

    const needMlMetadata =
      parsed.spec.crop ||
      parsed.spec.blur === "face" ||
      parsed.spec.blur === "eyes" ||
      (parsed.spec.watermark != null && parsed.spec.watermark !== "none");
    const image = await prisma.image.findFirst({
      where: { id: imageId, deletedAt: null },
      select: {
        storageKey: true,
        blurSuggested: true,
        ...(needMlMetadata && {
          imageMlMetadata: { select: { data: true } },
        }),
      },
    });

    if (!image?.storageKey) {
      logRequest(imageId, parsed.spec, "miss", 404, Date.now() - start, request.log);
      return reply.status(404).send({ error: "image_not_found" });
    }

    let buffer: Buffer;
    let contentType: string;
    try {
      const origin = await fetchFromStorage(image.storageKey);
      buffer = origin.buffer;
      contentType = origin.contentType;
    } catch (e) {
      request.log.error(e, "S3 fetch failed");
      logRequest(imageId, parsed.spec, "miss", 502, Date.now() - start, request.log);
      return reply.status(502).send({ error: "upstream_fetch_failed" });
    }

    const mlMetadata =
      image.imageMlMetadata && typeof image.imageMlMetadata.data === "object"
        ? (image.imageMlMetadata.data as unknown as ImageMlMetadataData)
        : null;

    const blurMode: BlurMode =
      parsed.spec.blur ??
      resolveBlurMode({
        context: parsed.spec.context ?? "public",
        mlSuggestedBlur: image.blurSuggested ?? false,
        featureBlurForce: process.env.FEATURE_BLUR_FORCE as BlurMode | undefined,
        featureBlurDisabled: process.env.FEATURE_BLUR_DISABLED === "true",
      });

    const key = cacheKey(imageId, query);
    if (isMemoryCacheEnabled()) {
      const cached = memoryCacheGet(key);
      if (cached) {
        logRequest(imageId, parsed.spec, "hit", 200, Date.now() - start, request.log);
        return reply
          .header("Content-Type", cached.contentType)
          .header("Cache-Control", "public, max-age=31536000, immutable")
          .header("X-IMS-Cache", "hit")
          .send(cached.buffer);
      }
    }

    try {
      const result = await runPipeline({
        buffer,
        contentType,
        spec: parsed.spec,
        mlMetadata: needMlMetadata ? mlMetadata : undefined,
        blurMode,
        watermarkKind: parsed.spec.watermark,
        watermarkSlug: parsed.spec.slug,
      });
      if (isMemoryCacheEnabled()) {
        memoryCacheSet(key, { buffer: result.buffer, contentType: result.contentType });
      }
      logRequest(imageId, parsed.spec, "miss", 200, Date.now() - start, request.log);
      return reply
        .header("Content-Type", result.contentType)
        .header("Cache-Control", "public, max-age=31536000, immutable")
        .header("X-IMS-Cache", "miss")
        .send(result.buffer);
    } catch (e) {
      request.log.error(e, "Pipeline failed");
      logRequest(imageId, parsed.spec, "miss", 500, Date.now() - start, request.log);
      return reply.status(500).send({ error: "processing_failed" });
    }
  });

  const port = Number(process.env.PORT) || 4001;
  await app.listen({ port, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
