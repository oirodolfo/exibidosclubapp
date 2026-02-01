import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { DriftDetectionService } from "./drift-detection.service";
import { MetricsService } from "./metrics.service";
import { LoggingInterceptor } from "./logging.interceptor";

@Module({
  providers: [
    DriftDetectionService,
    MetricsService,
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
  exports: [DriftDetectionService, MetricsService],
})
export class ObservabilityModule {}
