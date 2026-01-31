/**
 * IMS — Image Manipulation Service
 * Strongly-typed transformation contracts. Versioned for cache safety.
 */

export const TRANSFORM_CONTRACT_VERSION = 1;

/** Fit mode for resize (deterministic output) */
export type FitMode = "cover" | "contain" | "fill" | "inside";

/** Output encoding */
export type OutputFormat = "jpeg" | "webp";

/** Crop mode: ML-aware or fallback. Product rules decide which mode to use. */
export type CropMode = "face" | "body" | "interest" | "explicit" | "center";

/** Blur mode: policy-driven; overridable via query or feature flags. */
export type BlurMode = "none" | "eyes" | "face" | "full";

/** Request context for blur policy (public vs private). */
export type BlurContext = "public" | "private";

/** Parsed and validated transformation spec (never raw params in pipeline) */
export interface TransformSpec {
  /** Contract version — bump when semantics change; old URLs keep working */
  v: number;
  /** Max width (pixels) */
  w?: number;
  /** Max height (pixels) */
  h?: number;
  /** Resize fit */
  fit: FitMode;
  /** Output format */
  fmt: OutputFormat;
  /** Quality 1–100 (applied per format) */
  q: number;
  /** Optional: intelligent crop mode; when set, crop step runs before resize */
  crop?: CropMode;
  /** Optional: blur override (none|eyes|face|full); when absent, policy + context decide */
  blur?: BlurMode;
  /** Optional: context for blur policy (public|private) */
  context?: BlurContext;
}

/** Defaults for missing params (per version) */
export const DEFAULTS: TransformSpec = {
  v: TRANSFORM_CONTRACT_VERSION,
  fit: "inside",
  fmt: "jpeg",
  q: 85,
};

/** Bounds for validation */
export const BOUNDS = {
  maxWidth: 2048,
  maxHeight: 2048,
  minDimension: 1,
  minQuality: 1,
  maxQuality: 100,
} as const;
