import {
  Body,
  Controller,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { VerificationService } from "./verification.service.js";
import { VerificationCodeRateLimitGuard } from "./verification-code-rate-limit.guard.js";

class CreateCodeDto {
  userId!: string;
  deviceFingerprint!: string;
  sessionId!: string;
  ipHash?: string;
}

@Controller("verification")
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  @Post("code")
  @HttpCode(HttpStatus.OK)
  @UseGuards(VerificationCodeRateLimitGuard)
  async createCode(
    @Body()
    body: CreateCodeDto
  ): Promise<{ code: string; expiresAt: string }> {
    const ipHash = body.ipHash ?? "";
    return this.verification.createCode({
      userId: body.userId,
      deviceFingerprint: body.deviceFingerprint,
      sessionId: body.sessionId,
      ipHash,
    });
  }
}
