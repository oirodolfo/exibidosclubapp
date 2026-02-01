import { Injectable } from "@nestjs/common";
import { prisma } from "@exibidos/db/client";
import type { ImageMlMetadataData } from "@exibidos/ml-contracts";
import type { BlurMode } from "../transform/contracts";
import { CacheService } from "../cache/cache.service";
import { BlurPolicyService } from "../policy/blur-policy.service";
import { StorageService } from "./storage.service";
import { TransformService } from "../transform/transform.service";
import { ParserService, type ParseError, type ParseResult } from "../transform/parser.service";

export interface ServeResult {
  buffer: Buffer;
  contentType: string;
  cacheHit: boolean;
}

export interface ServeError {
  status: 400 | 404 | 502 | 503 | 500;
  code: string;
  message?: string;
}

@Injectable()
export class ImageService {
  constructor(
    private readonly storage: StorageService,
    private readonly cache: CacheService,
    private readonly blurPolicy: BlurPolicyService,
    private readonly parser: ParserService,
    private readonly transform: TransformService
  ) {}

  async serve(
    imageId: string,
    query: Record<string, string | undefined>
  ): Promise<{ ok: true; result: ServeResult } | { ok: false; error: ServeError }> {
    if (!this.storage.isConfigured()) {
      return { ok: false, error: { status: 503, code: "storage_unavailable" } };
    }

    const parsed = this.parser.parse(query);
    if (!parsed.ok) {
      const err = parsed as ParseError;
      return { ok: false, error: { status: 400, code: err.code, message: err.message } };
    }

    const spec = (parsed as ParseResult).spec;
    const needMlMetadata =
      !!spec.crop ||
      spec.blur === "face" ||
      spec.blur === "eyes" ||
      (spec.watermark != null && spec.watermark !== "none");

    const image = await prisma.image.findFirst({
      where: { id: imageId, deletedAt: null },
      select: {
        storageKey: true,
        blurSuggested: true,
        ...(needMlMetadata && { imageMlMetadata: { select: { data: true } } }),
      },
    });

    if (!image?.storageKey) {
      return { ok: false, error: { status: 404, code: "image_not_found" } };
    }

    const cacheKey = this.cache.buildKey(imageId, query);
    if (this.cache.isEnabled()) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return {
          ok: true,
          result: { buffer: cached.buffer, contentType: cached.contentType, cacheHit: true },
        };
      }
    }

    let buffer: Buffer;
    let contentType: string;
    try {
      const origin = await this.storage.fetch(image.storageKey);
      buffer = origin.buffer;
      contentType = origin.contentType;
    } catch {
      return { ok: false, error: { status: 502, code: "upstream_fetch_failed" } };
    }

    const mlMetadata: ImageMlMetadataData | null =
      image.imageMlMetadata && typeof image.imageMlMetadata.data === "object"
        ? (image.imageMlMetadata.data as unknown as ImageMlMetadataData)
        : null;

    const blurMode: BlurMode =
      spec.blur ??
      this.blurPolicy.resolveBlurMode({
        context: spec.context ?? "public",
        mlSuggestedBlur: image.blurSuggested ?? false,
        featureBlurForce: (process.env.FEATURE_BLUR_FORCE as BlurMode) ?? null,
        featureBlurDisabled: process.env.FEATURE_BLUR_DISABLED === "true",
      });

    try {
      const result = await this.transform.runPipeline({
        buffer,
        contentType,
        spec,
        mlMetadata: needMlMetadata ? mlMetadata : undefined,
        blurMode,
        watermarkKind: spec.watermark,
        watermarkSlug: spec.slug,
      });

      if (this.cache.isEnabled()) {
        this.cache.set(cacheKey, { buffer: result.buffer, contentType: result.contentType });
      }

      return {
        ok: true,
        result: { buffer: result.buffer, contentType: result.contentType, cacheHit: false },
      };
    } catch {
      return { ok: false, error: { status: 500, code: "processing_failed" } };
    }
  }
}
