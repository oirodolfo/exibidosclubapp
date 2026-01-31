/**
 * Evaluation and gating decision artifact.
 * No model may reach production without passing gates.
 */

export type GateDecision = "approve" | "reject" | "require_manual_review";

export interface GateCheck {
  name: string;
  passed: boolean;
  message?: string;
  details?: Record<string, unknown>;
}

export interface GateDecisionArtifact {
  /** New candidate model version */
  candidate_version: string;
  /** Current production model version (or null if none) */
  production_version: string | null;
  /** Final decision */
  decision: GateDecision;
  /** Human-readable explanation */
  reason: string;
  checks: GateCheck[];
  /** Optional metric deltas (candidate vs production) */
  metricDeltas?: Record<string, number>;
  createdAt: string;
}
