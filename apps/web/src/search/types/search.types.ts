/**
 * Search domain types. Framework-agnostic; migration-ready for NestJS.
 */

export type SearchEntityType = "profile" | "photo" | "category" | "tag";

export interface SearchMatch {
  entityType: SearchEntityType;
  entityId: string;
  /** Display label (slug, caption, name, etc.) */
  label: string;
  /** Matched field for ranking */
  matchedField: string;
  /** Match quality: prefix_exact | word | fuzzy */
  matchQuality: "prefix_exact" | "word" | "fuzzy";
  /** Optional: slug for profile, thumbKey for photo, etc. */
  slug?: string;
  thumbKey?: string | null;
  /** For ranking: popularity/recency boosts */
  popularityNorm?: number;
  recencyDecay?: number;
}

export interface MegaSearchResult {
  profiles: Array<{ id: string; slug: string; displayName: string | null }>;
  photos: Array<{ id: string; caption: string | null; slug: string; thumbKey: string | null }>;
  categories: Array<{ id: string; name: string; slug: string }>;
  tags: Array<{ id: string; name: string; slug: string; categoryId: string }>;
}

export interface FullSearchResult {
  profiles: Array<{ id: string; slug: string; displayName: string | null; bio: string | null }>;
  photos: Array<{ id: string; caption: string | null; slug: string; thumbKey: string | null }>;
  categories: Array<{ id: string; name: string; slug: string; description: string | null }>;
  tags: Array<{ id: string; name: string; slug: string; categoryId: string }>;
  total: { profiles: number; photos: number; categories: number; tags: number };
}

export interface SearchInput {
  q: string;
  limit?: number;
  offset?: number;
  types?: SearchEntityType[];
}

export interface MegaSearchInput {
  q: string;
}
