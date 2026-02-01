import { Injectable } from "@nestjs/common";
import type { DatasetArtifact } from "@exibidos/ml-contracts";
import type { VersionedDatasetStore } from "./dataset-artifact.service";

@Injectable()
export class InMemoryDatasetStoreService implements VersionedDatasetStore {
  private readonly artifacts = new Map<string, DatasetArtifact>();
  private readonly payloads = new Map<string, string>();

  async write(artifact: DatasetArtifact, payload: string): Promise<void> {
    if (this.artifacts.has(artifact.dataset_version)) {
      throw new Error(`Dataset version already exists: ${artifact.dataset_version}`);
    }
    this.artifacts.set(artifact.dataset_version, artifact);
    this.payloads.set(artifact.dataset_version, payload);
  }

  async listVersions(): Promise<string[]> {
    return Array.from(this.artifacts.keys()).sort().reverse();
  }
}
