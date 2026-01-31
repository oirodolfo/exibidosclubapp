/**
 * Feedback loop — route low-confidence to Label Studio, prioritize, feed corrections back.
 */

export interface FeedbackCandidate {
  /** Image/task id */
  imageId: string;
  /** Model confidence (0–1); lower = higher priority */
  modelConfidence: number;
  /** User disagreement score (0–1); higher = more disagreement = higher priority */
  userDisagreement: number;
  /** Combined priority score (higher = send to Label Studio first) */
  priorityScore: number;
  /** Optional ref for Label Studio task */
  ref?: string;
  createdAt: string;
}

export interface FeedbackLoopConfig {
  /** Min model confidence below which we always consider for Label Studio */
  lowConfidenceThreshold: number;
  /** Min user disagreement above which we prioritize */
  highDisagreementThreshold: number;
  /** Max candidates to return per run */
  maxCandidatesPerRun: number;
}

export const DEFAULT_FEEDBACK_CONFIG: FeedbackLoopConfig = {
  lowConfidenceThreshold: 0.6,
  highDisagreementThreshold: 0.3,
  maxCandidatesPerRun: 100,
};
