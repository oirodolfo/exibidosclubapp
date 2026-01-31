import { Injectable } from "@nestjs/common";

export interface CacheEntry {
  buffer: Buffer;
  contentType: string;
  createdAt: number;
}

@Injectable()
export class CacheService {
  private readonly store = new Map<string, CacheEntry>();
  private readonly order: string[] = [];
  private maxSize = 0;
  private ttlSeconds = 3600;

  configure(options: { maxSize?: number; ttlSeconds?: number }): void {
    if (options.maxSize !== undefined) this.maxSize = options.maxSize;
    if (options.ttlSeconds !== undefined) this.ttlSeconds = options.ttlSeconds;
  }

  buildKey(imageId: string, query: Record<string, string | undefined>): string {
    const entries = Object.entries(query).filter(
      ([, v]) => v !== undefined && v !== null && v !== ""
    ) as [string, string][];
    entries.sort(([a], [b]) => a.localeCompare(b));
    const q = entries.map(([k, v]) => `${k}=${v}`).join("&");
    return q ? `${imageId}:${q}` : imageId;
  }

  get(key: string): CacheEntry | null {
    if (this.maxSize === 0) return null;
    const entry = this.store.get(key);
    if (!entry) return null;
    if (
      this.ttlSeconds > 0 &&
      (Date.now() - entry.createdAt) / 1000 > this.ttlSeconds
    ) {
      this.store.delete(key);
      const i = this.order.indexOf(key);
      if (i >= 0) this.order.splice(i, 1);
      return null;
    }
    const i = this.order.indexOf(key);
    if (i >= 0) {
      this.order.splice(i, 1);
      this.order.push(key);
    }
    return entry;
  }

  set(key: string, entry: Omit<CacheEntry, "createdAt">): void {
    if (this.maxSize === 0) return;
    while (this.store.size >= this.maxSize && this.order.length > 0) {
      const k = this.order.shift()!;
      this.store.delete(k);
    }
    const full: CacheEntry = { ...entry, createdAt: Date.now() };
    this.store.set(key, full);
    const i = this.order.indexOf(key);
    if (i >= 0) this.order.splice(i, 1);
    this.order.push(key);
  }

  isEnabled(): boolean {
    return this.maxSize > 0;
  }
}
