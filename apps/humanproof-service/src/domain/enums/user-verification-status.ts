/**
 * User verification status (proof of life).
 * Pure domain enum — no framework decorators.
 */
export const UserVerificationStatus = {
  UNVERIFIED: "UNVERIFIED",
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  REVOKED: "REVOKED",
  REQUIRES_RECHECK: "REQUIRES_RECHECK",
} as const;

export type UserVerificationStatus =
  (typeof UserVerificationStatus)[keyof typeof UserVerificationStatus];
