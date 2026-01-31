import type { UserVerificationStatus } from "../enums/user-verification-status.js";

/**
 * Verification attempt entity (proof-of-life code attempt).
 * Pure domain entity — no framework decorators.
 */
export interface VerificationAttempt {
  readonly id: string;
  readonly userId: string;
  readonly deviceFingerprint: string;
  readonly sessionId: string;
  readonly ipHash: string;
  readonly code: string;
  readonly status: UserVerificationStatus;
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly failureReasons: readonly string[];
}

export type VerificationAttemptCreate = Omit<
  VerificationAttempt,
  "createdAt" | "expiresAt"
> & {
  createdAt?: Date;
  expiresAt?: Date;
};
