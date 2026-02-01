/**
 * Search domain config. Framework-agnostic; migration-ready for NestJS.
 */

export const SEARCH_CONFIG = {
  /** MegaSearch: max results per entity type */
  megasearch: {
    maxPerType: 4,
    minQueryLength: 1,
    maxQueryLength: 64,
  },

  /** Full search: defaults */
  fullSearch: {
    defaultLimit: 20,
    maxLimit: 50,
    defaultOffset: 0,
  },

  /** Cache: TTL in seconds */
  cache: {
    ttlSeconds: 60,
    maxKeys: 1000,
  },

  /** Ranking weights (MegaSearch) */
  ranking: {
    typeWeight: {
      profile: 1.0,
      photo: 0.7,
      category: 0.6,
      tag: 0.5,
    },
    fieldWeight: {
      username: 3.0,
      profileName: 2.5,
      photoTitle: 2.0,
      categoryName: 1.8,
      tagName: 1.5,
      captionOrDescription: 1.0,
    },
    matchQualityWeight: {
      prefix_exact: 2.0,
      word: 1.5,
      fuzzy: 1.1,
    },
  },
} as const;
