/**
 * IMS — Image Manipulation Service
 * Stateless, CDN-friendly. Never serves originals; only derived variants.
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
import { prisma } from "@exibidos/db/client";
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

    const image = await prisma.image.findFirst({
      where: { id: imageId, deletedAt: null },
      select: { storageKey: true },
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

    try {
      const result = await runPipeline({
        buffer,
        contentType,
        spec: parsed.spec,
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
