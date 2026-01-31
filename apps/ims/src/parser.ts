/**
 * Parse and validate URL/query params into TransformSpec.
 * Invalid or out-of-bounds values are rejected (400). Used by IMS to build cache-safe URLs.
 */

import type { TransformSpec } from "./contracts.js";
import {
  BOUNDS,
  DEFAULTS,
  TRANSFORM_CONTRACT_VERSION,
  type BlurContext,
  type BlurMode,
  type CropMode,
  type FitMode,
  type OutputFormat,
  type WatermarkKind,
} from "./contracts.js";

/** Allowed contract version range (1–99) for cache and backward compatibility. */
const VERSION_MIN = 1;
const VERSION_MAX = 99;

export interface ParseResult {
  ok: true;
  spec: TransformSpec;
}

export interface ParseError {
  ok: false;
  code: "invalid_version" | "invalid_dimension" | "invalid_quality" | "invalid_fit" | "invalid_format";
  message: string;
}

/** Parse query string into a validated TransformSpec; returns error when invalid. */
export function parseTransformSpec(query: Record<string, string | undefined>): ParseResult | ParseError {
  const vRaw = query.v ?? query.version;
  const v = vRaw !== undefined ? parseInt(vRaw, 10) : TRANSFORM_CONTRACT_VERSION;
  if (Number.isNaN(v) || v < VERSION_MIN || v > VERSION_MAX) {
    return { ok: false, code: "invalid_version", message: `v must be ${VERSION_MIN}–${VERSION_MAX}` };
  }

  const wRaw = query.w ?? query.width;
  const w = wRaw !== undefined ? parseInt(wRaw, 10) : undefined;
  const hRaw = query.h ?? query.height;
  const h = hRaw !== undefined ? parseInt(hRaw, 10) : undefined;

  if (w !== undefined && (Number.isNaN(w) || w < BOUNDS.minDimension || w > BOUNDS.maxWidth)) {
    return { ok: false, code: "invalid_dimension", message: `w must be ${BOUNDS.minDimension}–${BOUNDS.maxWidth}` };
  }
  if (h !== undefined && (Number.isNaN(h) || h < BOUNDS.minDimension || h > BOUNDS.maxHeight)) {
    return { ok: false, code: "invalid_dimension", message: `h must be ${BOUNDS.minDimension}–${BOUNDS.maxHeight}` };
  }

  const qRaw = query.q ?? query.quality;
  const q = qRaw !== undefined ? parseInt(qRaw, 10) : DEFAULTS.q;
  if (Number.isNaN(q) || q < BOUNDS.minQuality || q > BOUNDS.maxQuality) {
    return { ok: false, code: "invalid_quality", message: `q must be ${BOUNDS.minQuality}–${BOUNDS.maxQuality}` };
  }

  const fitRaw = (query.fit ?? "inside").toLowerCase();
  const fitMap: Record<string, FitMode> = {
    cover: "cover",
    contain: "contain",
    fill: "fill",
    inside: "inside",
  };
  const fit = fitMap[fitRaw] ?? DEFAULTS.fit;

  const fmtRaw = (query.fmt ?? query.format ?? "jpeg").toLowerCase();
  const fmtMap: Record<string, OutputFormat> = {
    jpeg: "jpeg",
    jpg: "jpeg",
    webp: "webp",
  };
  const fmt = fmtMap[fmtRaw] ?? DEFAULTS.fmt;

  const cropRaw = query.crop?.toLowerCase();
  const cropMap: Record<string, CropMode> = {
    face: "face",
    body: "body",
    interest: "interest",
    explicit: "explicit",
    center: "center",
  };
  const crop = cropRaw ? cropMap[cropRaw] : undefined;

  const blurRaw = query.blur?.toLowerCase();
  const blurMap: Record<string, BlurMode> = {
    none: "none",
    eyes: "eyes",
    face: "face",
    full: "full",
  };
  const blur = blurRaw ? blurMap[blurRaw] : undefined;

  const contextRaw = query.context?.toLowerCase();
  const contextMap: Record<string, BlurContext> = {
    public: "public",
    private: "private",
  };
  const context = contextRaw ? contextMap[contextRaw] : undefined;

  const watermarkRaw = query.watermark?.toLowerCase();
  const watermarkMap: Record<string, WatermarkKind> = {
    brand: "brand",
    user: "user",
    none: "none",
  };
  const watermark = watermarkRaw ? watermarkMap[watermarkRaw] : undefined;
  const slug = query.slug?.trim();

  const spec: TransformSpec = {
    v,
    ...(w !== undefined && { w }),
    ...(h !== undefined && { h }),
    fit,
    fmt,
    q,
    ...(crop && { crop }),
    ...(blur && { blur }),
    ...(context && { context }),
    ...(watermark && { watermark }),
    ...(slug && { slug }),
  };

  return { ok: true, spec };
}
