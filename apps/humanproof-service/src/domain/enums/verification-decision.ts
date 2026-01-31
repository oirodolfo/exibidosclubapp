/**
 * Final verification decision.
 * Pure domain enum — no framework decorators.
 */
export const VerificationDecision = {
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
  REQUIRES_MANUAL_REVIEW: "REQUIRES_MANUAL_REVIEW",
} as const;

export type VerificationDecision =
  (typeof VerificationDecision)[keyof typeof VerificationDecision];
