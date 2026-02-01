/**
 * Search UI state: MegaSearch (query, panel, fullscreen) + full search page (query, filters).
 * Use Zustand for state; TanStack Query for all fetches (useMegasearch, useSearch, useCategories).
 * Persisted to localStorage: last megasearch/full-search query and type filters (panel open state is not persisted).
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SearchEntityType = "profile" | "photo" | "category" | "tag";

type SearchState = {
  // MegaSearch (global header)
  megasearchQuery: string;
  megasearchPanelOpen: boolean;
  megasearchFullScreenOpen: boolean;
  setMegasearchQuery: (q: string) => void;
  openMegasearchPanel: () => void;
  closeMegasearchPanel: () => void;
  openMegasearchFullScreen: () => void;
  closeMegasearchFullScreen: () => void;
  closeMegasearch: () => void;

  // Full search page (/search)
  fullSearchQuery: string;
  fullSearchFiltersOpen: boolean;
  fullSearchTypes: SearchEntityType[] | undefined;
  setFullSearchQuery: (q: string) => void;
  setFullSearchFiltersOpen: (open: boolean) => void;
  setFullSearchTypes: (types: SearchEntityType[] | undefined) => void;
};

const PERSIST_KEY = "exibidos-search";

type PersistedSlice = Pick<
  SearchState,
  "megasearchQuery" | "fullSearchQuery" | "fullSearchTypes"
>;

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      megasearchQuery: "",
      megasearchPanelOpen: false,
      megasearchFullScreenOpen: false,
      setMegasearchQuery: (q) => set({ megasearchQuery: q }),
      openMegasearchPanel: () =>
        set({ megasearchPanelOpen: true, megasearchFullScreenOpen: false }),
      closeMegasearchPanel: () => set({ megasearchPanelOpen: false }),
      openMegasearchFullScreen: () =>
        set({ megasearchFullScreenOpen: true, megasearchPanelOpen: false }),
      closeMegasearchFullScreen: () => set({ megasearchFullScreenOpen: false }),
      closeMegasearch: () =>
        set({ megasearchPanelOpen: false, megasearchFullScreenOpen: false }),

      fullSearchQuery: "",
      fullSearchFiltersOpen: false,
      fullSearchTypes: undefined,
      setFullSearchQuery: (q) => set({ fullSearchQuery: q }),
      setFullSearchFiltersOpen: (open) => set({ fullSearchFiltersOpen: open }),
      setFullSearchTypes: (types) => set({ fullSearchTypes: types }),
    }),
    {
      name: PERSIST_KEY,
      partialize: (state): PersistedSlice => ({
        megasearchQuery: state.megasearchQuery,
        fullSearchQuery: state.fullSearchQuery,
        fullSearchTypes: state.fullSearchTypes,
      }),
    }
  ) as import("zustand").StateCreator<SearchState, [], []>
);
