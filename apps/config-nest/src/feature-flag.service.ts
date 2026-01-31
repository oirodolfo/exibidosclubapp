import { Injectable } from "@nestjs/common";
import { ML_FLAG_KEYS, type FeatureFlagKey, type RolloutPercent } from "@exibidos/feature-flags";

/**
 * Injectable feature-flag service — model versions, thresholds, rollout %.
 * No hardcoded config; read from env or external store.
 */
@Injectable()
export class FeatureFlagService {
  get(key: FeatureFlagKey): boolean {
    const v = process.env[`FEATURE_${key.toUpperCase().replace(/\./g, "_")}`];
    return v === "true" || v === "1";
  }

  getRolloutPct(key: FeatureFlagKey): RolloutPercent {
    const v = process.env[`FEATURE_${key.toUpperCase().replace(/\./g, "_")}_ROLLOUT_PCT`];
    if (v === undefined || v === "") return 0;
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? 0 : Math.min(100, Math.max(0, n));
  }

  get mlModelVersion(): string | null {
    return process.env.ML_MODEL_VERSION ?? process.env[ML_FLAG_KEYS.MODEL_VERSION] ?? null;
  }

  get mlRolloutPct(): RolloutPercent {
    return this.getRolloutPct(ML_FLAG_KEYS.ROLLOUT_PCT as FeatureFlagKey) ||
      (process.env.ML_ROLLOUT_PCT ? parseInt(process.env.ML_ROLLOUT_PCT, 10) : 0) ||
      0;
  }

  get mlPipelineEnabled(): boolean {
    return process.env.FEATURE_ML_PIPELINE === "true" || process.env[ML_FLAG_KEYS.ENABLE_ML_PIPELINE] === "true";
  }
}
