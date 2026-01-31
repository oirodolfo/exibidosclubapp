/**
 * IMS transformation contracts — versioned for cache safety.
 * Aligned with @exibidos/image-sdk; used by parser and pipeline.
 */

export const TRANSFORM_CONTRACT_VERSION = 1;

export type FitMode = "cover" | "contain" | "fill" | "inside";
export type OutputFormat = "jpeg" | "webp";
export type CropMode = "face" | "body" | "interest" | "explicit" | "center";
export type BlurMode = "none" | "eyes" | "face" | "full";
export type BlurContext = "public" | "private";
export type WatermarkKind = "brand" | "user" | "none";

export interface TransformSpec {
  v: number;
  w?: number;
  h?: number;
  fit: FitMode;
  fmt: OutputFormat;
  q: number;
  crop?: CropMode;
  blur?: BlurMode;
  context?: BlurContext;
  watermark?: WatermarkKind;
  slug?: string;
}

export const DEFAULTS: TransformSpec = {
  v: TRANSFORM_CONTRACT_VERSION,
  fit: "inside",
  fmt: "jpeg",
  q: 85,
};

export const BOUNDS = {
  maxWidth: 2048,
  maxHeight: 2048,
  minDimension: 1,
  minQuality: 1,
  maxQuality: 100,
} as const;
