import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { DriftDetectionService } from "./drift-detection.service.js";
import { MetricsService } from "./metrics.service.js";
import { LoggingInterceptor } from "./logging.interceptor.js";

@Module({
  providers: [
    DriftDetectionService,
    MetricsService,
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
  exports: [DriftDetectionService, MetricsService],
})
export class ObservabilityModule {}
