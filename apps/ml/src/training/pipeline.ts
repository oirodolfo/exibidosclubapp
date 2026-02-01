/**
 * Automated training pipeline contract.
 * Triggers when a new validated dataset is available; produces model_version, metrics, config snapshot.
 * Actual training runs in a separate job (e.g. Python); this defines inputs/outputs and orchestration.
 */

import type { ValidationReport } from "../validation/index";
import type { TrainingConfig } from "./config";
import { deterministicSplits } from "./splits";
import type { TrainingMetricsArtifact } from "./metrics";

export interface TrainingPipelineInput {
  /** Dataset version that passed validation */
  dataset_version: string;
  validation_report: ValidationReport;
  /** Raw payload (taxonomy export) for splits */
  payload: string;
  config: TrainingConfig;
  /** Optional task id -> owner id for leakage-free splits */
  taskOwner?: (taskId: string) => string;
}

export interface TrainingPipelineOutput {
  /** New model version (immutable) */
  model_version: string;
  dataset_version: string;
  /** Metrics artifact (per class, per region) */
  metrics: TrainingMetricsArtifact;
  /** Snapshot of config used */
  configSnapshot: TrainingConfig;
  /** Train/val/test task IDs for audit */
  splitSummary: { train: number; val: number; test: number };
}

/**
 * Prepare training run: validate report, compute splits, produce output contract.
 * A separate trainer (e.g. Python) consumes splitSummary + payload and writes model + metrics.
 * This function does NOT run training; it produces the plan and config snapshot.
 */
export function prepareTrainingRun(input: TrainingPipelineInput): {
  plan: Omit<TrainingPipelineOutput, "metrics">;
  splits: ReturnType<typeof deterministicSplits>;
  payload: string;
} {
  if (!input.validation_report.passed) {
    throw new Error(
      "Training blocked: validation failed. Fix dataset and re-validate."
    );
  }

  const export_ = JSON.parse(input.payload) as import("../taxonomy/v1").TaxonomyV1Export;
  const splits = deterministicSplits(
    export_,
    input.config,
    input.taskOwner
  );

  const model_version = `model_${Date.now()}_${input.dataset_version.slice(0, 12)}`;

  const plan: Omit<TrainingPipelineOutput, "metrics"> = {
    model_version,
    dataset_version: input.dataset_version,
    configSnapshot: { ...input.config },
    splitSummary: {
      train: splits.train.length,
      val: splits.val.length,
      test: splits.test.length,
    },
  };

  return { plan, splits, payload: input.payload };
}

/** Build a placeholder metrics artifact (trainer fills real values). */
export function createMetricsPlaceholder(
  model_version: string,
  dataset_version: string
): TrainingMetricsArtifact {
  return {
    model_version,
    dataset_version,
    classMetrics: [],
    regionMetrics: [],
    overall: {},
    createdAt: new Date().toISOString(),
  };
}
