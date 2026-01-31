/**
 * Taxonomy v1 — canonical schema for human ground truth and validation.
 * All Label Studio exports and dataset artifacts must conform to this version.
 */

export const TAXONOMY_VERSION = "taxonomy_v1";

/** Allowed region types in taxonomy_v1 */
export const REGION_TYPES = [
  "face",
  "body",
  "interest",
  "explicit",
] as const;

export type RegionType = (typeof REGION_TYPES)[number];

/** Allowed classification labels (policy/semantic) in taxonomy_v1 */
export const CLASS_LABELS = [
  "safe",
  "sensitive",
  "explicit",
  "unknown",
] as const;

export type ClassLabel = (typeof CLASS_LABELS)[number];

/** Single region in normalized 0–1 coordinates */
export interface TaxonomyRegion {
  type: RegionType;
  x: number;
  y: number;
  w: number;
  h: number;
  confidence?: number;
}

/** One annotation (ground truth) for a task */
export interface TaxonomyAnnotation {
  regions: TaxonomyRegion[];
  /** Primary semantic/policy class */
  classLabel: ClassLabel;
  /** Optional per-region overrides */
  regionLabels?: Record<number, ClassLabel>;
}

/** Task = one unit of labeling (e.g. one image) */
export interface TaxonomyTask {
  id: string;
  /** External reference (e.g. imageId, storage key) */
  ref: string;
  annotations: TaxonomyAnnotation[];
}

/** Full taxonomy v1 export shape for validation */
export interface TaxonomyV1Export {
  version: typeof TAXONOMY_VERSION;
  exportedAt: string;
  tasks: TaxonomyTask[];
}

export function isTaxonomyV1Export(
  data: unknown
): data is TaxonomyV1Export {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (d.version !== TAXONOMY_VERSION) return false;
  if (typeof d.exportedAt !== "string") return false;
  if (!Array.isArray(d.tasks)) return false;
  for (const t of d.tasks as unknown[]) {
    if (!isTaxonomyTask(t)) return false;
  }
  return true;
}

function isTaxonomyTask(t: unknown): t is TaxonomyTask {
  if (!t || typeof t !== "object") return false;
  const x = t as Record<string, unknown>;
  if (typeof x.id !== "string" || typeof x.ref !== "string") return false;
  if (!Array.isArray(x.annotations)) return false;
  for (const a of x.annotations as unknown[]) {
    if (!isTaxonomyAnnotation(a)) return false;
  }
  return true;
}

function isTaxonomyAnnotation(a: unknown): a is TaxonomyAnnotation {
  if (!a || typeof a !== "object") return false;
  const x = a as Record<string, unknown>;
  if (!CLASS_LABELS.includes((x.classLabel as ClassLabel) ?? "unknown")) return false;
  if (!Array.isArray(x.regions)) return false;
  for (const r of x.regions as unknown[]) {
    if (!isTaxonomyRegion(r)) return false;
  }
  return true;
}

function isTaxonomyRegion(r: unknown): r is TaxonomyRegion {
  if (!r || typeof r !== "object") return false;
  const x = r as Record<string, unknown>;
  if (!REGION_TYPES.includes((x.type as RegionType) ?? "face")) return false;
  if (typeof x.x !== "number" || typeof x.y !== "number") return false;
  if (typeof x.w !== "number" || typeof x.h !== "number") return false;
  if (x.x < 0 || x.x > 1 || x.y < 0 || x.y > 1) return false;
  if (x.w <= 0 || x.w > 1 || x.h <= 0 || x.h > 1) return false;
  return true;
}
