import { Module } from "@nestjs/common";
import { TrainingJobRunnerService } from "./training-job-runner.service";
import { TrainingOrchestratorService } from "./training-orchestrator.service";

@Module({
  providers: [TrainingJobRunnerService, TrainingOrchestratorService],
  exports: [TrainingOrchestratorService],
})
export class TrainingModule {}
