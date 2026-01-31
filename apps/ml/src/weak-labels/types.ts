/**
 * Weak label types — user-generated signals, never mixed with ground truth.
 * Used only for: sample prioritization, semi-supervised training, exploration.
 */

export type WeakLabelSource = "user_tag" | "vote" | "swipe";

export interface WeakLabel {
  /** Image (task) this label applies to */
  imageId: string;
  /** Origin of the signal */
  source: WeakLabelSource;
  /** Optional tag/category (for tagging and vote signals) */
  tagId?: string;
  categoryId?: string;
  /** Confidence 0–1 (e.g. from agreement or heuristic) */
  confidence: number;
  /** Weight for loss (always < 1 vs human labels = 1) */
  weight: number;
  /** Optional raw payload for debugging */
  meta?: Record<string, unknown>;
  createdAt: string;
}

/** Input shapes from app DB (denormalized for normalization). */
export interface UserTagInput {
  imageId: string;
  tagId: string;
  categoryId?: string;
  source: string;
  confidence?: number | null;
}

export interface VoteInput {
  imageId: string;
  userId: string;
  tagId: string | null;
  weight: number;
}

export interface SwipeInput {
  imageId: string;
  userId: string;
  direction: string;
  categoryId: string | null;
}
