import { Module } from "@nestjs/common";
import { VerificationCodeRepository } from "../../application/ports/verification-code.repository.js";
import { InMemoryVerificationCodeRepository } from "../../infra/persistence/in-memory-verification-code.repository.js";
import { VerificationController } from "./verification.controller.js";
import { VerificationService } from "./verification.service.js";
import { VerificationCodeRateLimitGuard } from "./verification-code-rate-limit.guard.js";

@Module({
  controllers: [VerificationController],
  providers: [
    VerificationService,
    VerificationCodeRateLimitGuard,
    {
      provide: VerificationCodeRepository,
      useClass: InMemoryVerificationCodeRepository,
    },
  ],
  exports: [VerificationService],
})
export class VerificationModule {}
