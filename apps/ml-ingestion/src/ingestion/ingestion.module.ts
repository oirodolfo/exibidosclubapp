import { Module } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ScheduleModule } from "@nestjs/schedule";
import { LabelStudioClientService } from "./label-studio-client.service";
import { TaxonomyValidatorService } from "./taxonomy-validator.service";
import { InMemoryDatasetStoreService } from "./in-memory-dataset-store.service";
import { DatasetArtifactService } from "./dataset-artifact.service";
import { IngestionJobService } from "./ingestion-job.service";
import { IngestionSchedulerService } from "./ingestion-scheduler.service";

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
