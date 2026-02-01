/**
 * Search service: orchestrates repository, ranking, cache.
 * Framework-agnostic; migration-ready for NestJS.
 */

import { SEARCH_CONFIG } from "../config/search.config";
import { getSearchCache } from "./cache.service";
import {
  rankProfiles,
  rankPhotos,
  rankCategories,
  rankTags,
} from "./ranking.service";
import {
  searchLight,
  searchFull,
  normalizeQuery,
  type FullProfileHit,
  type FullPhotoHit,
  type FullCategoryHit,
  type FullTagHit,
} from "../repositories/search.repository";
import type { MegaSearchResponseDto } from "../dto/megasearch.dto";
import type { SearchResponseDto } from "../dto/search.dto";

const { megasearch: megasearchConfig, fullSearch: fullSearchConfig, cache: cacheConfig } = SEARCH_CONFIG;

function cacheKey(prefix: string, q: string, type?: string): string {
  const t = type ?? "all";

  return `search:${prefix}:${t}:${q}`;
}

/** MegaSearch: light index, ranking, cache by prefix. */
export async function runMegaSearch(q: string): Promise<MegaSearchResponseDto> {
  const normalized = normalizeQuery(q, megasearchConfig.maxQueryLength);

  if (normalized.length < megasearchConfig.minQueryLength) {
    return { profiles: [], photos: [], categories: [], tags: [] };
  }

  const cache = getSearchCache({ ttlSeconds: cacheConfig.ttlSeconds, maxKeys: cacheConfig.maxKeys });
  const key = cacheKey("megasearch", normalized);
  const cached = cache.get<MegaSearchResponseDto>(key);

  if (cached) return cached;

  const raw = await searchLight(normalized, megasearchConfig.maxPerType);

  const profiles = rankProfiles(normalized, raw.profiles, megasearchConfig.maxPerType).map((p) => ({
    id: p.id,
    slug: p.slug,
    displayName: p.displayName,
  }));

  const photos = rankPhotos(normalized, raw.photos, megasearchConfig.maxPerType).map((p) => ({
    id: p.id,
    caption: p.caption,
    slug: p.slug,
    thumbKey: p.thumbKey,
  }));

  const categories = rankCategories(normalized, raw.categories, megasearchConfig.maxPerType).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
  }));

  const tags = rankTags(normalized, raw.tags, megasearchConfig.maxPerType).map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    categoryId: t.categoryId,
  }));

  const result: MegaSearchResponseDto = {
    profiles,
    photos,
    categories,
    tags,
  };

  cache.set(key, result);

  return result;
}

/** Full search: full index, pagination, optional cache. */
export async function runFullSearch(params: {
  q: string;
  limit?: number;
  offset?: number;
  types?: ("profile" | "photo" | "category" | "tag")[];
}): Promise<SearchResponseDto> {
  const normalized = normalizeQuery(params.q, megasearchConfig.maxQueryLength);

  if (normalized.length < megasearchConfig.minQueryLength) {
    return {
      profiles: [],
      photos: [],
      categories: [],
      tags: [],
      total: { profiles: 0, photos: 0, categories: 0, tags: 0 },
    };
  }

  const limit = Math.min(
    params.limit ?? fullSearchConfig.defaultLimit,
    fullSearchConfig.maxLimit
  );
  const offset = params.offset ?? fullSearchConfig.defaultOffset;
  const types = params.types;

  const raw = await searchFull(normalized, { limit, offset, types });

  const result: SearchResponseDto = {
    profiles: raw.profiles.map((p: FullProfileHit) => ({
      id: p.id,
      slug: p.slug,
      displayName: p.displayName,
      bio: p.bio,
    })),
    photos: raw.photos.map((p: FullPhotoHit) => ({
      id: p.id,
      caption: p.caption,
      slug: p.slug,
      thumbKey: p.thumbKey,
    })),
    categories: raw.categories.map((c: FullCategoryHit) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
    })),
    tags: raw.tags.map((t: FullTagHit) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      categoryId: t.categoryId,
    })),
    total: raw.total,
  };

  return result;
}

/** Invalidate cache by query prefix (e.g. on new content or edit). */
export function invalidateSearchCache(prefix: string): void {
  const cache = getSearchCache();

  cache.invalidateByPrefix(`search:megasearch:all:${prefix}`);
}
