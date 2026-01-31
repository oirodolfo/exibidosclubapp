import { Module } from "@nestjs/common";
import { WeakLabelNormalizerService } from "./weak-label-normalizer.service.js";
import { WeakLabelStoreService } from "./weak-label-store.service.js";
import { WeakLabelStatsService } from "./weak-label-stats.service.js";
import { WeakLabelIngestionService } from "./weak-label-ingestion.service.js";

@Module({
  providers: [
    WeakLabelNormalizerService,
    WeakLabelStoreService,
    WeakLabelStatsService,
    WeakLabelIngestionService,
  ],
  exports: [WeakLabelIngestionService, WeakLabelStatsService, WeakLabelStoreService],
})
export class WeakLabelModule {}
