/**
 * Automated Label Studio dataset ingestion.
 * Periodically pulls exports, validates against taxonomy_v1, rejects invalid/mixed-version,
 * and writes immutable versioned dataset artifacts.
 */

import { createHash } from "crypto";
import {
  TAXONOMY_VERSION,
  isTaxonomyV1Export,
  type TaxonomyV1Export,
} from "../taxonomy/v1.js";
import { canonicalPayload, type DatasetArtifact } from "./artifact.js";
import { exportHasNewOrUpdatedAnnotations, fetchLabelStudioExport, type LabelStudioConfig } from "./label-studio-client.js";
import type { VersionedDatasetStore } from "./versioned-store.js";

export interface IngestionConfig {
  labelStudio: LabelStudioConfig;
  store: VersionedDatasetStore;
  /** Last known annotation updated_at (ISO); null = always ingest */
  lastSeenUpdatedAt?: string | null;
  /** Version generator; default: timestamp-based */
  versionForExport?: (export_: TaxonomyV1Export) => string;
}

export class InvalidOrMixedVersionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidOrMixedVersionError";
  }
}

/** Run one ingestion cycle: fetch, validate, reject if invalid, write new artifact. */
export async function runIngestion(config: IngestionConfig): Promise<{
  ok: true;
  artifact: DatasetArtifact;
} | { ok: false; reason: string }> {
  const raw = await fetchLabelStudioExport(config.labelStudio);

  if (!isTaxonomyV1Export(raw)) {
    const version = (raw as { version?: string })?.version;
    if (version && version !== TAXONOMY_VERSION) {
      throw new InvalidOrMixedVersionError(
        `Mixed or invalid taxonomy version: got ${version}, expected ${TAXONOMY_VERSION}. Rejecting.`
      );
    }
    return {
      ok: false,
      reason: "Export does not match taxonomy_v1 schema. Rejecting invalid data.",
    };
  }

  const export_ = raw as TaxonomyV1Export;

  if (!exportHasNewOrUpdatedAnnotations(export_, config.lastSeenUpdatedAt ?? null)) {
    return { ok: false, reason: "No new or updated annotations; skipping." };
  }

  const payload = canonicalPayload(export_);
  const checksum = createHash("sha256").update(payload).digest("hex");
  const version =
    config.versionForExport?.(export_) ??
    `ds_${Date.now()}_${checksum.slice(0, 8)}`;

  const artifact: DatasetArtifact = {
    dataset_version: version,
    taxonomy_version: TAXONOMY_VERSION,
    checksum,
    createdAt: new Date().toISOString(),
    taskCount: export_.tasks.length,
  };

  try {
    await config.store.write(artifact, payload);
  } catch (e) {
    if ((e as Error).message?.includes("already exists")) {
      return { ok: false, reason: `Dataset version ${version} already exists.` };
    }
    throw e;
  }

  return { ok: true, artifact };
}
