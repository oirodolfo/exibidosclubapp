/**
 * Confidence and threshold types — shared across ML pipeline.
 * All apps import from shared packages; no app-defined ML types.
 */

/** Confidence score in [0, 1]. */
export type Confidence = number;

/** Assert value is in [0, 1]. */
export function clampConfidence(value: number): Confidence {
  return Math.min(1, Math.max(0, value));
}

/** Weight for loss: human = 1.0, weak labels < 1.0. */
export type LossWeight = number;

/** Threshold for minimum metric (e.g. min macro F1). */
export interface MinThreshold {
  min: number;
}

/** Threshold for maximum value (e.g. max correction rate). */
export interface MaxThreshold {
  max: number;
}

/** Range threshold [min, max]. */
export interface RangeThreshold {
  min: number;
  max: number;
}

/** Percentile (0–100). */
export type Percentile = number;
