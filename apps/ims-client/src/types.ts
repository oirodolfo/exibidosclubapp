/**
 * IMS client — types aligned with IMS contract.
 * Single source of truth for building image URLs; governance tool, not a helper.
 */

export const IMS_CONTRACT_VERSION = 1;

export type FitMode = "cover" | "contain" | "fill" | "inside";
export type OutputFormat = "jpeg" | "webp";
export type CropMode = "face" | "body" | "interest" | "explicit" | "center";
export type BlurMode = "none" | "eyes" | "face" | "full";
export type BlurContext = "public" | "private";
export type WatermarkKind = "brand" | "user" | "none";

/** Preset name: official use cases only. */
export type PresetName = "feed" | "swipe" | "ranking" | "profile" | "og";

/** Options for building IMS query string. Safety and privacy rules enforced via presets. */
export interface ImageUrlParams {
  v?: number;
  w?: number;
  h?: number;
  fit?: FitMode;
  fmt?: OutputFormat;
  q?: number;
  crop?: CropMode;
  blur?: BlurMode;
  context?: BlurContext;
  watermark?: WatermarkKind;
  slug?: string;
}
