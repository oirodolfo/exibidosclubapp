/**
 * Automated dataset validation before training.
 * Validates: schema, taxonomy version, class distribution, region bbox validity.
 * Produces a validation report artifact; blocks training if validation fails.
 */

import {
  CLASS_LABELS,
  TAXONOMY_VERSION,
  isTaxonomyV1Export,
  type TaxonomyV1Export,
} from "../taxonomy/v1";
import type { ValidationCheck, ValidationReport } from "./types";

export interface ValidateInput {
  dataset_version: string;
  taxonomy_version: string;
  payload: string;
  payloadChecksum?: string;
  /** Optional: min samples per class to pass distribution check */
  minSamplesPerClass?: number;
  /** Optional: max class imbalance ratio (maxCount/minCount) */
  maxImbalanceRatio?: number;
}

/** Run all validation checks; produce report. Training must be blocked when report.passed is false. */
export function validateDataset(input: ValidateInput): ValidationReport {
  const checks: ValidationCheck[] = [];
  let parsed: TaxonomyV1Export | null = null;

  // 1. Schema correctness
  try {
    const data = JSON.parse(input.payload) as unknown;
    if (!isTaxonomyV1Export(data)) {
      checks.push({
        name: "schema",
        passed: false,
        message: "Payload does not match taxonomy_v1 schema",
      });
    } else {
      parsed = data;
      checks.push({ name: "schema", passed: true });
    }
  } catch (e) {
    checks.push({
      name: "schema",
      passed: false,
      message: (e as Error).message,
    });
  }

  // 2. Taxonomy version consistency
  const versionOk = input.taxonomy_version === TAXONOMY_VERSION;
  checks.push({
    name: "taxonomy_version",
    passed: versionOk,
    message: versionOk ? undefined : `Expected ${TAXONOMY_VERSION}, got ${input.taxonomy_version}`,
  });

  // 3. Class distribution sanity (only if parsed)
  if (parsed) {
    const dist: Record<string, number> = {};
    for (const label of CLASS_LABELS) dist[label] = 0;
    for (const task of parsed.tasks) {
      for (const ann of task.annotations) {
        const L = ann.classLabel as string;
        dist[L] = (dist[L] ?? 0) + 1;
      }
    }
    const counts = Object.values(dist).filter((c) => c > 0);
    const minSamples = input.minSamplesPerClass ?? 1;
    const maxRatio = input.maxImbalanceRatio ?? 1000;
    const minCount = Math.min(...counts, 1);
    const maxCount = Math.max(...counts, 0);
    const imbalanceRatio = minCount > 0 ? maxCount / minCount : Infinity;
    const distOk =
      counts.length > 0 &&
      minCount >= minSamples &&
      (input.maxImbalanceRatio === undefined || imbalanceRatio <= maxRatio);
    checks.push({
      name: "class_distribution",
      passed: distOk,
      message: distOk ? undefined : "Class distribution failed (too few samples or too imbalanced)",
      details: {
        distribution: dist,
        minSamplesPerClass: minSamples,
        imbalanceRatio: Number.isFinite(imbalanceRatio) ? imbalanceRatio : null,
      },
    });
  }

  // 4. Region bounding box validity (only if parsed)
  if (parsed) {
    let bboxOk = true;
    const invalid: string[] = [];
    for (const task of parsed.tasks) {
      for (const ann of task.annotations) {
        for (let i = 0; i < ann.regions.length; i++) {
          const r = ann.regions[i];
          if (
            r.x < 0 || r.x > 1 || r.y < 0 || r.y > 1 ||
            r.w <= 0 || r.w > 1 || r.h <= 0 || r.h > 1 ||
            r.x + r.w > 1 || r.y + r.h > 1
          ) {
            bboxOk = false;
            invalid.push(`${task.id}:ann:${i}`);
          }
        }
      }
    }
    checks.push({
      name: "region_bbox_validity",
      passed: bboxOk,
      message: bboxOk ? undefined : `Invalid bboxes: ${invalid.slice(0, 5).join(", ")}${invalid.length > 5 ? "..." : ""}`,
      details: invalid.length > 0 ? { invalidCount: invalid.length, sampleIds: invalid.slice(0, 10) } : undefined,
    });
  }

  const passed = checks.every((c) => c.passed);

  return {
    dataset_version: input.dataset_version,
    taxonomy_version: input.taxonomy_version,
    passed,
    checks,
    payloadChecksum: input.payloadChecksum,
    createdAt: new Date().toISOString(),
  };
}
