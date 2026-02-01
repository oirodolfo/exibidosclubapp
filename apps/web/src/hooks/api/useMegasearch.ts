/**
 * MegaSearch: instant search with debounce and request cancellation.
 * 250ms debounce; AbortController cancels previous request.
 */

import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useMemo } from "react";

export interface MegaSearchProfile {
  id: string;
  slug: string;
  displayName: string | null;
}

export interface MegaSearchPhoto {
  id: string;
  caption: string | null;
  slug: string;
  thumbKey: string | null;
  thumbUrl?: string | null;
}

export interface MegaSearchCategory {
  id: string;
  name: string;
  slug: string;
}

export interface MegaSearchTag {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
}

export interface MegaSearchResult {
  profiles: MegaSearchProfile[];
  photos: MegaSearchPhoto[];
  categories: MegaSearchCategory[];
  tags: MegaSearchTag[];
}

const MIN_QUERY_LENGTH = 1;

async function fetchMegasearch(q: string, signal?: AbortSignal): Promise<MegaSearchResult> {
  const params = new URLSearchParams({ q: q.trim() });
  const res = await fetch(`/api/search/megasearch?${params}`, { signal });

  if (!res.ok) {
    const err = (await res.json()).error ?? "megasearch_failed";

    throw new Error(err);
  }

  return res.json();
}

export function useMegasearch(query: string) {
  const deferredQuery = useDeferredValue(query);
  const trimmed = useMemo(
    () => deferredQuery.trim().toLowerCase(),
    [deferredQuery]
  );
  const enabled = trimmed.length >= MIN_QUERY_LENGTH;

  return useQuery({
    queryKey: ["megasearch", trimmed],
    queryFn: ({ signal }) => fetchMegasearch(trimmed, signal),
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

