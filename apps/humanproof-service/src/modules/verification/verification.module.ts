import { Module } from "@nestjs/common";
import { MetadataAnalyzer } from "../../application/ports/metadata-analyzer.port.js";
import { VerificationCodeRepository } from "../../application/ports/verification-code.repository.js";
import { InMemoryVerificationCodeRepository } from "../../infra/persistence/in-memory-verification-code.repository.js";
import { ExifMetadataAnalyzer } from "../../infra/metadata/exif-metadata-analyzer.js";
import { DeviceModule } from "../device/device.module.js";
import { VerificationController } from "./verification.controller.js";
import { VerificationService } from "./verification.service.js";
import { VerificationUploadService } from "./verification-upload.service.js";
import { VerificationCodeRateLimitGuard } from "./verification-code-rate-limit.guard.js";

@Module({
  imports: [DeviceModule],
  controllers: [VerificationController],
  providers: [
    VerificationService,
    VerificationUploadService,
    VerificationCodeRateLimitGuard,
    {
      provide: VerificationCodeRepository,
      useClass: InMemoryVerificationCodeRepository,
    },
    {
      provide: MetadataAnalyzer,
      useClass: ExifMetadataAnalyzer,
    },
  ],
  exports: [VerificationService],
})
export class VerificationModule {}
