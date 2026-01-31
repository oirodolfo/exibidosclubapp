/**
 * Immutable dataset artifact produced by ingestion.
 * Every dataset is versioned and checksummed; no overwrite.
 */

import type { TaxonomyV1Export } from "../taxonomy/v1.js";

export interface DatasetArtifact {
  /** Unique immutable version (e.g. timestamp or sequence) */
  dataset_version: string;
  /** Must be taxonomy_v1 */
  taxonomy_version: string;
  /** SHA-256 of canonical JSON (no key order variance) */
  checksum: string;
  /** When this artifact was created (ISO) */
  createdAt: string;
  /** Number of tasks in the dataset */
  taskCount: number;
  /** Raw export used to build this artifact (reference only; store separately if needed) */
  payload?: TaxonomyV1Export;
}

/** Canonical serialization for checksum (sorted keys). */
export function canonicalPayload(export_: TaxonomyV1Export): string {
  return JSON.stringify(export_, Object.keys(export_).sort());
}
