/**
 * Weak label store interface — implement with DB or file.
 * Weak labels are stored separately from ground truth; never mixed.
 */

import type { WeakLabel } from "./types";

export interface WeakLabelStore {
  /** Append weak labels (idempotent by imageId+source+tagId/categoryId if needed). */
  write(labels: WeakLabel[]): Promise<void>;
  /** Get all weak labels for an image (for prioritization / training). */
  getByImage(imageId: string): Promise<WeakLabel[]>;
  /** List image IDs that have at least one weak label (for sampling). */
  listImageIds(limit?: number): Promise<string[]>;
}

/** In-memory store for tests. */
export function createInMemoryWeakLabelStore(): WeakLabelStore {
  const byImage = new Map<string, WeakLabel[]>();

  return {
    async write(labels: WeakLabel[]): Promise<void> {
      for (const l of labels) {
        const list = byImage.get(l.imageId) ?? [];
        list.push(l);
        byImage.set(l.imageId, list);
      }
    },
    async getByImage(imageId: string): Promise<WeakLabel[]> {
      return byImage.get(imageId) ?? [];
    },
    async listImageIds(limit = 10_000): Promise<string[]> {
      return Array.from(byImage.keys()).slice(0, limit);
    },
  };
}
