import { Module } from "@nestjs/common";
import { WeakLabelNormalizerService } from "./weak-label-normalizer.service";
import { WeakLabelStoreService } from "./weak-label-store.service";
import { WeakLabelStatsService } from "./weak-label-stats.service";
import { WeakLabelIngestionService } from "./weak-label-ingestion.service";

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
