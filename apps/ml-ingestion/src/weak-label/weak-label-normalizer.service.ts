import { Injectable } from "@nestjs/common";
import type { WeakLabel, UserTagInput, VoteInput, SwipeInput } from "@exibidos/ml-contracts";

export const WEAK_LABEL_MAX_WEIGHT = 0.5;

@Injectable()
export class WeakLabelNormalizerService {
  normalizeUserTag(input: UserTagInput, createdAt: string): WeakLabel {
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

  normalizeVote(input: VoteInput, createdAt: string): WeakLabel {
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

  normalizeSwipe(input: SwipeInput, createdAt: string): WeakLabel {
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
}
