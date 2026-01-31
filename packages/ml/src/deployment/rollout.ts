/**
 * Gradual rollout: 5% → 25% → 100%.
 * Models are versioned; no in-place overwrite. Rollback = set active version to previous.
 */

import { DEFAULT_ROLLOUT_STAGES } from "./types.js";
import type { ModelDeployment, RolloutConfig, RolloutStage } from "./types.js";

export interface RolloutStateStore {
  /** Get current deployment (which version at which %) */
  getActive(): Promise<ModelDeployment | null>;
  /** Set active model version and rollout % (audit trail). */
  setActive(deployment: ModelDeployment): Promise<void>;
  /** List all deployed versions (for rollback target). */
  listDeployed(): Promise<ModelDeployment[]>;
}

/** Map rollout percentage to stage label. */
export function rolloutPctToStage(pct: number): RolloutStage {
  if (pct >= 100) return "pct_100";
  if (pct >= 25) return "pct_25";
  if (pct >= 5) return "pct_5";
  return "pct_5";
}

/** Next stage in sequence: 5 → 25 → 100. */
export function nextRolloutStage(
  currentPct: number,
  config: { stages?: number[] } = {}
): number | null {
  const stages = config.stages ?? [...DEFAULT_ROLLOUT_STAGES];
  const sorted = [...stages].sort((a, b) => a - b);
  for (const pct of sorted) {
    if (pct > currentPct) return pct;
  }
  return null;
}

/** Promote a model version to the next rollout stage (or 5% if first). */
export function promoteToNextStage(
  current: ModelDeployment | null,
  newVersion: string,
  config: RolloutConfig
): ModelDeployment {
  const stages = config.stages ?? [...DEFAULT_ROLLOUT_STAGES];
  const sorted = [...stages].sort((a, b) => a - b);
  const nextPct = current
    ? nextRolloutStage(current.rollout_pct, { stages }) ?? current.rollout_pct
    : sorted[0] ?? 5;

  return {
    model_version: newVersion,
    rollout_pct: nextPct,
    stage: rolloutPctToStage(nextPct),
    promotedAt: new Date().toISOString(),
    previous_version: current?.model_version ?? null,
  };
}

/** Rollback: set active to previous version at 100%. */
export function rollbackDeployment(
  current: ModelDeployment
): ModelDeployment | null {
  if (!current.previous_version) return null;
  return {
    model_version: current.previous_version,
    rollout_pct: 100,
    stage: "pct_100",
    promotedAt: new Date().toISOString(),
    previous_version: current.model_version,
  };
}
