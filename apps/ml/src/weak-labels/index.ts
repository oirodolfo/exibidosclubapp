export {
  normalizeUserTag,
  normalizeVote,
  normalizeSwipe,
  WEAK_LABEL_MAX_WEIGHT,
} from "./normalize.js";
export { createInMemoryWeakLabelStore, type WeakLabelStore } from "./store.js";
export type {
  WeakLabel,
  WeakLabelSource,
  UserTagInput,
  VoteInput,
  SwipeInput,
} from "./types.js";
