import { Module } from "@nestjs/common";
import { ObservabilityModule } from "./observability/observability.module";

@Module({
  imports: [ObservabilityModule],
})
export class AppModule {}
