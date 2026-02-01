import { Module } from "@nestjs/common";
import { MetadataAnalyzer } from "../../application/ports/metadata-analyzer.port";
import { VerificationCodeRepository } from "../../application/ports/verification-code.repository";
import { InMemoryVerificationCodeRepository } from "../../infra/persistence/in-memory-verification-code.repository";
import { ExifMetadataAnalyzer } from "../../infra/metadata/exif-metadata-analyzer";
import { DeviceModule } from "../device/device.module";
import { VerificationController } from "./verification.controller";
import { VerificationService } from "./verification.service";
import { VerificationUploadService } from "./verification-upload.service";
import { VerificationCodeRateLimitGuard } from "./verification-code-rate-limit.guard";

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
