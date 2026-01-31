import { Module } from "@nestjs/common";
import { ObservabilityModule } from "./observability/observability.module.js";

@Module({
  imports: [ObservabilityModule],
})
export class AppModule {}
