/**
 * Swipe UI: current card index. Decoupled from TanStack Query data.
 * Used by SwipeFeed to track position; survives query refetches.
 */
import { create } from "zustand";

type SwipeState = {
  currentIndex: number;
  setCurrentIndex: (i: number | ((prev: number) => number)) => void;
  reset: () => void;
};

export const useSwipeStore = create<SwipeState>((set) => ({
  currentIndex: 0,
  setCurrentIndex: (i) =>
    set((s) => ({ currentIndex: typeof i === "function" ? i(s.currentIndex) : i })),
  reset: () => set({ currentIndex: 0 }),
}));
