import { Injectable, Logger } from "@nestjs/common";
import type { TrainingMetricsArtifact } from "@exibidos/ml-contracts";

export interface TrainingJobInput {
  dataset_version: string;
  taxonomy_version: string;
  /** Path or URL to dataset payload (or in-memory reference). */
  datasetPayloadPath?: string;
  /** Weak label weight (human = 1.0). */
  weakLabelWeight?: number;
  /** Random seed for reproducible splits. */
  seed?: number;
}

export interface TrainingJobResult {
  model_version: string;
  dataset_version: string;
  metrics: TrainingMetricsArtifact;
  /** Path to serialized model artifact (e.g. file path or S3 key). */
  modelArtifactPath?: string;
}

/**
 * Runs Python-based training. NestJS orchestrates; Python executes.
 * Replace with actual subprocess or HTTP call to training worker.
 */
@Injectable()
export class TrainingJobRunnerService {
  private readonly logger = new Logger(TrainingJobRunnerService.name);

  async run(input: TrainingJobInput): Promise<TrainingJobResult> {
    this.logger.log(
      `Training job requested: dataset=${input.dataset_version} taxonomy=${input.taxonomy_version}`
    );
    // TODO: spawn Python process or call training service
    // Example: child_process.spawn('python', ['train.py', '--dataset', input.dataset_version, ...])
    const model_version = `model_${Date.now()}_${input.dataset_version.slice(0, 12)}`;
    const metrics: TrainingMetricsArtifact = {
      model_version,
      dataset_version: input.dataset_version,
      classMetrics: [],
      regionMetrics: [],
      overall: { macroF1: 0, map: 0 },
      createdAt: new Date().toISOString(),
    };
    return { model_version, dataset_version: input.dataset_version, metrics };
  }
}
