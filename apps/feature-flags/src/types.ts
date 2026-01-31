/**
 * Feature flag types — model versions, thresholds, rollout percentages.
 * No hardcoded config values; all injectable.
 */

/** Feature flag key (e.g. ml_model_version, ml_rollout_pct). */
export type FeatureFlagKey = string;

/** Rollout percentage 0–100. */
export type RolloutPercent = number;

/** User override: force enabled or disabled for a user. */
export interface FeatureFlagOverride {
  flagId: string;
  userId: string;
  enabled: boolean;
}

/** Flag definition: key, default state, rollout %. */
export interface FeatureFlagDefinition {
  key: FeatureFlagKey;
  description?: string;
  enabled: boolean;
  rolloutPct: RolloutPercent;
}

/** ML-specific flag keys (canonical). */
export const ML_FLAG_KEYS = {
  MODEL_VERSION: "ml_model_version",
  ROLLOUT_PCT: "ml_rollout_pct",
  ENABLE_ML_PIPELINE: "ml_pipeline_enabled",
} as const;

export type MlFlagKey = (typeof ML_FLAG_KEYS)[keyof typeof ML_FLAG_KEYS];
