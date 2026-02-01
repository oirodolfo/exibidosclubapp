/**
 * Prioritize samples for Label Studio: low confidence + high user disagreement.
 * Human corrections feed back into next dataset version; loop runs continuously.
 */

import type { FeedbackCandidate, FeedbackLoopConfig } from "./types";
import { DEFAULT_FEEDBACK_CONFIG } from "./types";

export interface CandidateInput {
  imageId: string;
  modelConfidence: number;
  /** 0–1: e.g. 1 - agreement ratio among user labels */
  userDisagreement: number;
  ref?: string;
  createdAt: string;
}

/**
 * Compute priority score: higher = more valuable for human labeling.
 * Prioritize: low model confidence, high user disagreement.
 */
export function computePriorityScore(
  modelConfidence: number,
  userDisagreement: number,
  _config: FeedbackLoopConfig = DEFAULT_FEEDBACK_CONFIG
): number {
  const lowConf = 1 - Math.max(0, modelConfidence);
  const highDisag = Math.max(0, userDisagreement);
  return lowConf * 0.6 + highDisag * 0.4;
}

/**
 * Build and sort candidates for Label Studio; return top N.
 */
export function prioritizeCandidates(
  inputs: CandidateInput[],
  config: FeedbackLoopConfig = DEFAULT_FEEDBACK_CONFIG
): FeedbackCandidate[] {
  const candidates: FeedbackCandidate[] = inputs.map((i) => {
    const priorityScore = computePriorityScore(
      i.modelConfidence,
      i.userDisagreement,
      config
    );
    return {
      imageId: i.imageId,
      modelConfidence: i.modelConfidence,
      userDisagreement: i.userDisagreement,
      priorityScore,
      ref: i.ref,
      createdAt: i.createdAt,
    };
  });

  candidates.sort((a, b) => b.priorityScore - a.priorityScore);
  return candidates.slice(0, config.maxCandidatesPerRun);
}

/**
 * Filter inputs that meet minimum bar for feedback (low confidence or high disagreement).
 */
export function filterEligibleForFeedback(
  inputs: CandidateInput[],
  config: FeedbackLoopConfig = DEFAULT_FEEDBACK_CONFIG
): CandidateInput[] {
  return inputs.filter(
    (i) =>
      i.modelConfidence < config.lowConfidenceThreshold ||
      i.userDisagreement >= config.highDisagreementThreshold
  );
}
