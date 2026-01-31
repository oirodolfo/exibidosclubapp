/**
 * Safe deployment and rollout — versioned artifacts, gradual rollout, rollback.
 * Never replace models in-place; deploy as versioned artifacts; instant rollback via flag.
 */

export type RolloutStage = "pct_5" | "pct_25" | "pct_100";

export interface ModelDeployment {
  /** Model version (immutable artifact id) */
  model_version: string;
  /** Current rollout: 5% | 25% | 100% of uploads */
  rollout_pct: number;
  /** Stage label for audit */
  stage: RolloutStage;
  /** When this version was promoted to this stage (ISO) */
  promotedAt: string;
  /** Previous production version (for rollback) */
  previous_version: string | null;
}

export interface RolloutConfig {
  /** Rollout stages as percentage (5, 25, 100) */
  stages: number[];
  /** Feature flag key for ML model version override (e.g. ml_model_version) */
  featureFlagKey: string;
}

export const DEFAULT_ROLLOUT_STAGES = [5, 25, 100] as const;
