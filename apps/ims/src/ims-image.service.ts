/**
 * IMS image handler logic — used by Nest controller.
 */
import { prisma } from "@exibidos/db/client";
import type { ImageMlMetadataData } from "@exibidos/ml";
import type { BlurMode } from "./contracts";
import {
  cacheKey,
  memoryCacheGet,
  memoryCacheSet,
  isMemoryCacheEnabled,
} from "./cache";
import { logRequest } from "./observability";
import { resolveBlurMode } from "./blur-policies";
import { parseTransformSpec } from "./parser";
import { runPipeline } from "./pipeline";
import { fetchFromStorage, isStorageConfigured } from "./storage";

export interface ImageHandlerResult {
  statusCode: number;
  contentType?: string;
  buffer?: Buffer;
  cache?: "hit" | "miss";
  error?: string;
  message?: string;
}

export class ImsImageService {
  async handle(
    imageId: string,
    query: Record<string, string | undefined>
  ): Promise<ImageHandlerResult> {
    const start = Date.now();

    const noopLog = { info: (_o: object, _msg?: string) => {} };

    if (!isStorageConfigured()) {
      logRequest(
        imageId,
        { v: 1, fit: "inside", fmt: "jpeg", q: 85 },
        "miss",
        503,
        Date.now() - start,
        noopLog
      );
      return { statusCode: 503, error: "storage_unavailable" };
    }

    const parsed = parseTransformSpec(query);
    if (!parsed.ok) {
      logRequest(
        imageId,
        { v: 1, fit: "inside", fmt: "jpeg", q: 85 },
        "miss",
        400,
        Date.now() - start,
        noopLog
      );
      return {
        statusCode: 400,
        error: parsed.code,
        message: parsed.message,
      };
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
      logRequest(imageId, parsed.spec, "miss", 404, Date.now() - start, noopLog);
      return { statusCode: 404, error: "image_not_found" };
    }

    let buffer: Buffer;
    let contentType: string;
    try {
      const origin = await fetchFromStorage(image.storageKey);
      buffer = origin.buffer;
      contentType = origin.contentType;
    } catch {
      logRequest(imageId, parsed.spec, "miss", 502, Date.now() - start, noopLog);
      return { statusCode: 502, error: "upstream_fetch_failed" };
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
        logRequest(imageId, parsed.spec, "hit", 200, Date.now() - start, noopLog);
        return {
          statusCode: 200,
          contentType: cached.contentType,
          buffer: cached.buffer,
          cache: "hit",
        };
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
        memoryCacheSet(key, {
          buffer: result.buffer,
          contentType: result.contentType,
        });
      }
      logRequest(imageId, parsed.spec, "miss", 200, Date.now() - start, noopLog);
      return {
        statusCode: 200,
        contentType: result.contentType,
        buffer: result.buffer,
        cache: "miss",
      };
    } catch {
      logRequest(imageId, parsed.spec, "miss", 500, Date.now() - start, noopLog);
      return { statusCode: 500, error: "processing_failed" };
    }
  }
}
