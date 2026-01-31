import { Injectable } from "@nestjs/common";
import { UserVerificationStatus } from "../../domain/enums/user-verification-status.js";
import type { VerificationAttempt } from "../../domain/entities/verification-attempt.js";
import type { VerificationCodeRepository } from "../../application/ports/verification-code.repository.js";
import { HumanproofConfigService } from "../../config/humanproof-config.service.js";
import { randomBytes } from "node:crypto";

const CODE_LENGTH = 6;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

@Injectable()
export class VerificationService {
  constructor(
    private readonly repo: VerificationCodeRepository,
    private readonly config: HumanproofConfigService
  ) {}

  async createCode(params: {
    userId: string;
    deviceFingerprint: string;
    sessionId: string;
    ipHash: string;
  }): Promise<{ code: string; expiresAt: string }> {
    const now = new Date();
    const ttlMs =
      this.config.verificationCodeTtlSeconds * 1000;
    const expiresAt = new Date(now.getTime() + ttlMs);
    const code = this.generateCode();
    const id = randomBytes(16).toString("hex");
    const attempt: VerificationAttempt = {
      id,
      userId: params.userId,
      deviceFingerprint: params.deviceFingerprint,
      sessionId: params.sessionId,
      ipHash: params.ipHash,
      code: code.toUpperCase(),
      status: UserVerificationStatus.PENDING,
      createdAt: now,
      expiresAt,
      failureReasons: [],
    };
    await this.repo.save(attempt);
    return {
      code,
      expiresAt: expiresAt.toISOString(),
    };
  }

  private generateCode(): string {
    const bytes = randomBytes(CODE_LENGTH);
    let out = "";
    for (let i = 0; i < CODE_LENGTH; i++) {
      out += CODE_CHARS[bytes[i]! % CODE_CHARS.length];
    }
    return out;
  }
}
