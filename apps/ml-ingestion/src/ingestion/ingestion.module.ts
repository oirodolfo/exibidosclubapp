import { Module } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ScheduleModule } from "@nestjs/schedule";
import { LabelStudioClientService } from "./label-studio-client.service.js";
import { TaxonomyValidatorService } from "./taxonomy-validator.service.js";
import { InMemoryDatasetStoreService } from "./in-memory-dataset-store.service.js";
import { DatasetArtifactService } from "./dataset-artifact.service.js";
import { IngestionJobService } from "./ingestion-job.service.js";
import { IngestionSchedulerService } from "./ingestion-scheduler.service.js";

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
  ],
  providers: [
    LabelStudioClientService,
    TaxonomyValidatorService,
    InMemoryDatasetStoreService,
    DatasetArtifactService,
    IngestionJobService,
    IngestionSchedulerService,
  ],
  exports: [IngestionJobService, DatasetArtifactService, InMemoryDatasetStoreService],
})
export class IngestionModule {}
