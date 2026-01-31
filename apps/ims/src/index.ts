/**
 * IMS — Image Manipulation Service
 * Stateless, CDN-friendly. Never serves originals; only derived variants.
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
import { prisma } from "@exibidos/db/client";
import type { ImageMlMetadataData } from "@exibidos/ml";
import type { BlurMode } from "./contracts.js";
import { resolveBlurMode } from "./blur-policies.js";
import { parseTransformSpec } from "./parser.js";
import { runPipeline } from "./pipeline.js";
import { fetchFromS3, isStorageConfigured } from "./storage.js";

const app = Fastify({ logger: true });

async function main() {
  await app.register(cors, { origin: true });

  app.get("/health", async () => ({ status: "ok", service: "@exibidos/ims" }));

  /**
   * GET /i/:imageId
   * Query: w, h, fit, fmt, q, v (all optional; v = contract version for cache safety)
   * Returns derived image only. 404 if image missing; 400 if invalid params; 502 if upstream (S3) fails.
   */
  app.get<{
    Params: { imageId: string };
  }>("/i/:imageId", async (request, reply) => {
    const { imageId } = request.params;
    const query = request.query as Record<string, string | undefined>;

    if (!isStorageConfigured()) {
      return reply.status(503).send({ error: "storage_unavailable" });
    }

    const parsed = parseTransformSpec(query);
    if (!parsed.ok) {
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
      return reply.status(404).send({ error: "image_not_found" });
    }

    let buffer: Buffer;
    let contentType: string;
    try {
      const origin = await fetchFromS3(image.storageKey);
      buffer = origin.buffer;
      contentType = origin.contentType;
    } catch (e) {
      request.log.error(e, "S3 fetch failed");
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
      return reply
        .header("Content-Type", result.contentType)
        .header("Cache-Control", "public, max-age=31536000, immutable")
        .send(result.buffer);
    } catch (e) {
      request.log.error(e, "Pipeline failed");
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
