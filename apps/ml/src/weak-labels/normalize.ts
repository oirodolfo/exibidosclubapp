/**
 * Normalize user-generated signals into weak-label format.
 * Never mix these with ground-truth datasets.
 */

import type { SwipeInput, UserTagInput, VoteInput, WeakLabel } from "./types";

/** Default weight for weak labels (human = 1.0). */
export const WEAK_LABEL_MAX_WEIGHT = 0.5;

/** Normalize user tag (ImageTag) into a weak label. */
export function normalizeUserTag(input: UserTagInput, createdAt: string): WeakLabel {
  const confidence = input.confidence ?? 0.6;
  return {
    imageId: input.imageId,
    source: "user_tag",
    tagId: input.tagId,
    categoryId: input.categoryId,
    confidence: Math.min(1, Math.max(0, confidence)),
    weight: WEAK_LABEL_MAX_WEIGHT,
    createdAt,
  };
}

/** Normalize vote into a weak label (weight from vote weight). */
export function normalizeVote(input: VoteInput, createdAt: string): WeakLabel {
  const weight = input.weight > 0 ? Math.min(5, input.weight) / 5 : 0;
  return {
    imageId: input.imageId,
    source: "vote",
    tagId: input.tagId ?? undefined,
    confidence: 0.4 + weight * 0.3,
    weight: WEAK_LABEL_MAX_WEIGHT * (0.2 + weight * 0.8),
    createdAt,
  };
}

/** Normalize swipe (like + category) into a weak label. */
export function normalizeSwipe(input: SwipeInput, createdAt: string): WeakLabel {
  const isLike = input.direction === "like";
  return {
    imageId: input.imageId,
    source: "swipe",
    categoryId: input.categoryId ?? undefined,
    confidence: isLike ? 0.5 : 0.3,
    weight: isLike ? WEAK_LABEL_MAX_WEIGHT * 0.6 : WEAK_LABEL_MAX_WEIGHT * 0.2,
    createdAt,
  };
}
