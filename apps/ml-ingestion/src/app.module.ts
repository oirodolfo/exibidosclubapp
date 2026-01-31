import { Module } from "@nestjs/common";
import { IngestionModule } from "./ingestion/ingestion.module.js";
import { WeakLabelModule } from "./weak-label/weak-label.module.js";

@Module({
  imports: [IngestionModule, WeakLabelModule],
})
export class AppModule {}
