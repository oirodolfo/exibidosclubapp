import type { VerificationAttempt } from "../../domain/entities/verification-attempt.js";
import { VerificationCodeRepository } from "../../application/ports/verification-code.repository.js";

export class InMemoryVerificationCodeRepository extends VerificationCodeRepository {
  private readonly store = new Map<string, VerificationAttempt>();

  async save(attempt: VerificationAttempt): Promise<void> {
    this.store.set(attempt.id, attempt);
  }

  async findValid(
    userId: string,
    code: string,
    now: Date
  ): Promise<VerificationAttempt | null> {
    const normalized = code.trim().toUpperCase();
    for (const a of this.store.values()) {
      if (
        a.userId === userId &&
        a.code === normalized &&
        a.expiresAt > now &&
        a.status === "PENDING"
      ) {
        return a;
      }
    }
    return null;
  }

  async countByUserId(userId: string, since: Date): Promise<number> {
    let n = 0;
    for (const a of this.store.values()) {
      if (a.userId === userId && a.createdAt >= since) n++;
    }
    return n;
  }

  async countByDevice(
    deviceFingerprint: string,
    since: Date
  ): Promise<number> {
    let n = 0;
    for (const a of this.store.values()) {
      if (a.deviceFingerprint === deviceFingerprint && a.createdAt >= since)
        n++;
    }
    return n;
  }

  async deleteExpired(now: Date): Promise<number> {
    let deleted = 0;
    for (const [id, a] of this.store.entries()) {
      if (a.expiresAt <= now) {
        this.store.delete(id);
        deleted++;
      }
    }
    return deleted;
  }
}
