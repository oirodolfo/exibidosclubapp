/**
 * In-memory cache for search results. Prefix-based keys; TTL; migration-ready for NestJS.
 */

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export interface SearchCacheConfig {
  ttlSeconds: number;
  maxKeys: number;
}

const defaultConfig: SearchCacheConfig = {
  ttlSeconds: 60,
  maxKeys: 1000,
};

export class SearchCacheService {
  private cache = new Map<string, CacheEntry<unknown>>();
  private keyOrder: string[] = [];
  private config: SearchCacheConfig;

  constructor(config: Partial<SearchCacheConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private evictIfNeeded(): void {
    if (this.keyOrder.length < this.config.maxKeys) return;

    const toRemove = this.keyOrder.shift();

    if (toRemove) this.cache.delete(toRemove);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.keyOrder = this.keyOrder.filter((k) => k !== key);

      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T): void {
    this.evictIfNeeded();
    const expiresAt = Date.now() + this.config.ttlSeconds * 1000;

    this.cache.set(key, { data, expiresAt });

    const idx = this.keyOrder.indexOf(key);

    if (idx >= 0) this.keyOrder.splice(idx, 1);

    this.keyOrder.push(key);
  }

  /** Invalidate by prefix (e.g. all keys starting with "da" when new content added). */
  invalidateByPrefix(prefix: string): void {
    const toDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) toDelete.push(key);
    }

    for (const k of toDelete) {
      this.cache.delete(k);
      this.keyOrder = this.keyOrder.filter((x) => x !== k);
    }
  }

  clear(): void {
    this.cache.clear();
    this.keyOrder = [];
  }
}

let defaultInstance: SearchCacheService | null = null;

export function getSearchCache(config?: Partial<SearchCacheConfig>): SearchCacheService {
  if (!defaultInstance) defaultInstance = new SearchCacheService(config);

  return defaultInstance;
}
