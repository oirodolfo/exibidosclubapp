import { Injectable, Logger } from "@nestjs/common";
import type { ValidationReport } from "@exibidos/ml-contracts";
import type { TrainingJobInput, TrainingJobResult } from "./training-job-runner.service";
import { TrainingJobRunnerService } from "./training-job-runner.service";

export interface OrchestratorInput {
  dataset_version: string;
  taxonomy_version: string;
  validation_report: ValidationReport;
  /** Raw payload path or reference for Python (optional). */
  datasetPayloadPath?: string;
  weakLabelWeight?: number;
  seed?: number;
}

@Injectable()
export class TrainingOrchestratorService {
  private readonly logger = new Logger(TrainingOrchestratorService.name);

  constructor(private readonly jobRunner: TrainingJobRunnerService) {}

  /**
   * Trigger training when a new validated dataset is available.
   * Validation must have passed; no ML logic in NestJS.
   */
  async triggerTraining(input: OrchestratorInput): Promise<TrainingJobResult> {
    if (!input.validation_report.passed) {
      throw new Error("Training blocked: validation failed. Fix dataset and re-validate.");
    }

    const jobInput: TrainingJobInput = {
      dataset_version: input.dataset_version,
      taxonomy_version: input.taxonomy_version,
      datasetPayloadPath: input.datasetPayloadPath,
      weakLabelWeight: input.weakLabelWeight ?? 0.5,
      seed: input.seed ?? 42,
    };

    const result = await this.jobRunner.run(jobInput);
    this.logger.log(`Training completed: model_version=${result.model_version}`);
    return result;
  }
}
