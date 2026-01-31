/**
 * In-memory cache layer for IMS. URL is the cache key (immutable).
 * Version-based: changing policy = new URL = new cache entry; no purge needed.
 */

export interface CacheEntry {
  buffer: Buffer;
  contentType: string;
  createdAt: number;
}

/** Build deterministic cache key from imageId and query (sorted). */
export function cacheKey(imageId: string, query: Record<string, string | undefined>): string {
  const entries = Object.entries(query).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  ) as [string, string][];
  entries.sort(([a], [b]) => a.localeCompare(b));
  const q = entries.map(([k, v]) => `${k}=${v}`).join("&");
  return q ? `${imageId}:${q}` : imageId;
}

function getMax(): number {
  const v = process.env.IMS_MEMORY_CACHE_MAX;
  if (v === undefined || v === "") return 0;
  const n = parseInt(v, 10);
  return Number.isNaN(n) || n < 0 ? 0 : n;
}

function getTtlSeconds(): number {
  const v = process.env.IMS_MEMORY_CACHE_TTL;
  if (v === undefined || v === "") return 3600;
  const n = parseInt(v, 10);
  return Number.isNaN(n) || n < 0 ? 3600 : n;
}

const maxSize = getMax();
const ttlSec = getTtlSeconds();

const store = new Map<string, CacheEntry>();
const order: string[] = [];

function evictOne(): void {
  if (order.length === 0) return;
  const key = order.shift()!;
  store.delete(key);
}

export function memoryCacheGet(key: string): CacheEntry | null {
  if (maxSize === 0) return null;
  const entry = store.get(key);
  if (!entry) return null;
  if (ttlSec > 0 && (Date.now() - entry.createdAt) / 1000 > ttlSec) {
    store.delete(key);
    const i = order.indexOf(key);
    if (i >= 0) order.splice(i, 1);
    return null;
  }
  const i = order.indexOf(key);
  if (i >= 0) {
    order.splice(i, 1);
    order.push(key);
  }
  return entry;
}

export function memoryCacheSet(key: string, entry: Omit<CacheEntry, "createdAt">): void {
  if (maxSize === 0) return;
  while (store.size >= maxSize && order.length > 0) evictOne();
  const full: CacheEntry = { ...entry, createdAt: Date.now() };
  store.set(key, full);
  const i = order.indexOf(key);
  if (i >= 0) order.splice(i, 1);
  order.push(key);
}

export function isMemoryCacheEnabled(): boolean {
  return maxSize > 0;
}
