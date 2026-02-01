export {
  normalizeUserTag,
  normalizeVote,
  normalizeSwipe,
  WEAK_LABEL_MAX_WEIGHT,
} from "./normalize";
export { createInMemoryWeakLabelStore, type WeakLabelStore } from "./store";
export type {
  WeakLabel,
  WeakLabelSource,
  UserTagInput,
  VoteInput,
  SwipeInput,
} from "./types";
