import { Module } from "@nestjs/common";
import { TrainingJobRunnerService } from "./training-job-runner.service.js";
import { TrainingOrchestratorService } from "./training-orchestrator.service.js";

@Module({
  providers: [TrainingJobRunnerService, TrainingOrchestratorService],
  exports: [TrainingOrchestratorService],
})
export class TrainingModule {}
