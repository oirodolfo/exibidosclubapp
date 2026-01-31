/**
 * IMS — Image Manipulation Service
 * Strongly-typed transformation contracts. Versioned for cache safety.
 */

export const TRANSFORM_CONTRACT_VERSION = 1;

/** Fit mode for resize (deterministic output) */
export type FitMode = "cover" | "contain" | "fill" | "inside";

/** Output encoding */
export type OutputFormat = "jpeg" | "webp";

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
