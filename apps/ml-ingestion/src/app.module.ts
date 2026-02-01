import { Module } from "@nestjs/common";
import { IngestionModule } from "./ingestion/ingestion.module";
import { WeakLabelModule } from "./weak-label/weak-label.module";

@Module({
  imports: [IngestionModule, WeakLabelModule],
})
export class AppModule {}
