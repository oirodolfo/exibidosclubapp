import { Injectable } from "@nestjs/common";
import type { EventBusPort } from "../../application/ports/event-bus.port";
import type { VerificationAttempt } from "../../domain/entities/verification-attempt";
import type { VerificationCodeRepository } from "../../application/ports/verification-code.repository";
import { UserVerificationStatus } from "../../domain/enums/user-verification-status";
import { HumanproofConfigService } from "../../config/humanproof-config.service";
import { randomBytes } from "node:crypto";

const CODE_LENGTH = 6;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

@Injectable()
export class VerificationService {
  constructor(
    private readonly repo: VerificationCodeRepository,
    private readonly config: HumanproofConfigService,
    private readonly eventBus: EventBusPort
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
    await this.eventBus.emit({
      type: "humanproof.verification.started",
      userId: params.userId,
      deviceFingerprint: params.deviceFingerprint,
      sessionId: params.sessionId,
      timestamp: now.toISOString(),
    });
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
