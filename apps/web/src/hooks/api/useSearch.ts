/**
 * Full search: pagination, filters (types), totals.
 * Used on /search page.
 */

import { useQuery } from "@tanstack/react-query";

export type SearchEntityType = "profile" | "photo" | "category" | "tag";

export interface SearchProfile {
  id: string;
  slug: string;
  displayName: string | null;
  bio: string | null;
}

export interface SearchPhoto {
  id: string;
  caption: string | null;
  slug: string;
  thumbKey: string | null;
  thumbUrl?: string | null;
}

export interface SearchCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface SearchTag {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
}

export interface SearchResult {
  profiles: SearchProfile[];
  photos: SearchPhoto[];
  categories: SearchCategory[];
  tags: SearchTag[];
  total: { profiles: number; photos: number; categories: number; tags: number };
}

export interface SearchParams {
  q: string;
  limit?: number;
  offset?: number;
  types?: SearchEntityType[];
}

async function fetchSearch(params: SearchParams, signal?: AbortSignal): Promise<SearchResult> {
  const sp = new URLSearchParams();
  sp.set("q", params.q.trim());

  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.offset != null) sp.set("offset", String(params.offset));
  if (params.types?.length) sp.set("types", params.types.join(","));

  const res = await fetch(`/api/search?${sp}`, { signal });

  if (!res.ok) {
    const err = (await res.json()).error ?? "search_failed";

    throw new Error(err);
  }

  return res.json();
}

/** Normalize types for cache key: same set of types = same key (e.g. profile,photo === photo,profile). */
function typesKey(types: SearchEntityType[] | undefined): string {
  if (!types?.length) return "";
  return [...types].sort().join(",");
}

export function useSearch(params: SearchParams) {
  const typesKeyStable = typesKey(params.types);

  return useQuery({
    queryKey: ["search", params.q.trim(), params.limit, params.offset, typesKeyStable],
    queryFn: ({ signal }) => fetchSearch(params, signal),
    enabled: params.q.trim().length >= 1,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
