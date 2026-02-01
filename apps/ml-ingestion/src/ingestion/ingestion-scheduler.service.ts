import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { IngestionJobService } from "./ingestion-job.service";
import type { LabelStudioConfig } from "./label-studio-client.service";

@Injectable()
export class IngestionSchedulerService {
  private readonly logger = new Logger(IngestionSchedulerService.name);
  private config: LabelStudioConfig | null = null;

  constructor(private readonly ingestionJob: IngestionJobService) {}

  setConfig(config: LabelStudioConfig): void {
    this.config = config;
    this.ingestionJob.setConfig(config);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron(): Promise<void> {
    if (!this.config) {
      this.logger.debug("Label Studio config not set; skipping ingestion");
      return;
    }
    try {
      const result = await this.ingestionJob.run();
      if (result.ok) {
        this.logger.log(`Ingestion completed: dataset_version=${result.artifact.dataset_version}`);
      } else {
        this.logger.debug(`Ingestion skipped: ${result.reason}`);
      }
    } catch (e) {
      this.logger.error(e, "Ingestion job failed");
    }
  }
}
