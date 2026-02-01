import type { VerificationAttempt } from "../../domain/entities/verification-attempt";

/**
 * Port for verification code storage.
 * In-memory implementation provided; swap for Redis adapter for production.
 */
export abstract class VerificationCodeRepository {
  abstract save(attempt: VerificationAttempt): Promise<void>;
  abstract findValid(
    userId: string,
    code: string,
    now: Date
  ): Promise<VerificationAttempt | null>;
  abstract countByUserId(userId: string, since: Date): Promise<number>;
  abstract countByDevice(
    deviceFingerprint: string,
    since: Date
  ): Promise<number>;
  abstract deleteExpired(now: Date): Promise<number>;
}
