/**
 * Versioned storage for dataset artifacts.
 * Datasets are stored by version; no overwrite.
 */

import type { DatasetArtifact } from "./artifact";

export interface VersionedDatasetStore {
  /** Write artifact and payload to version path. Fails if version exists. */
  write(artifact: DatasetArtifact, payload: string): Promise<void>;
  /** Read artifact metadata by version */
  readArtifact(version: string): Promise<DatasetArtifact | null>;
  /** Read raw payload by version */
  readPayload(version: string): Promise<string | null>;
  /** List known dataset versions (newest first) */
  listVersions(): Promise<string[]>;
}

/** In-memory store for tests or single-node dev. */
export function createInMemoryDatasetStore(): VersionedDatasetStore {
  const artifacts = new Map<string, DatasetArtifact>();
  const payloads = new Map<string, string>();

  return {
    async write(artifact: DatasetArtifact, payload: string): Promise<void> {
      if (artifacts.has(artifact.dataset_version)) {
        throw new Error(`Dataset version already exists: ${artifact.dataset_version}`);
      }
      artifacts.set(artifact.dataset_version, artifact);
      payloads.set(artifact.dataset_version, payload);
    },
    async readArtifact(version: string): Promise<DatasetArtifact | null> {
      return artifacts.get(version) ?? null;
    },
    async readPayload(version: string): Promise<string | null> {
      return payloads.get(version) ?? null;
    },
    async listVersions(): Promise<string[]> {
      return Array.from(artifacts.keys()).sort().reverse();
    },
  };
}
