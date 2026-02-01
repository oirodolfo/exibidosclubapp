import { createHash } from "crypto";
import { Injectable } from "@nestjs/common";
import type { DatasetArtifact } from "@exibidos/ml-contracts";
import { canonicalPayload } from "@exibidos/ml-contracts";
import { TAXONOMY_VERSION } from "@exibidos/taxonomy";
import type { TaxonomyV1Export } from "@exibidos/taxonomy";
import { InMemoryDatasetStoreService } from "./in-memory-dataset-store.service";

export interface VersionedDatasetStore {
  write(artifact: DatasetArtifact, payload: string): Promise<void>;
  listVersions(): Promise<string[]>;
}

@Injectable()
export class DatasetArtifactService {
  constructor(private readonly store: InMemoryDatasetStoreService) {}

  createArtifact(export_: TaxonomyV1Export, version?: string): DatasetArtifact {
    const payload = canonicalPayload(export_);
    const checksum = createHash("sha256").update(payload).digest("hex");
    const dataset_version =
      version ?? `ds_${Date.now()}_${checksum.slice(0, 8)}`;

    return {
      dataset_version,
      taxonomy_version: TAXONOMY_VERSION,
      checksum,
      createdAt: new Date().toISOString(),
      taskCount: export_.tasks.length,
    };
  }

  async persist(artifact: DatasetArtifact, payload: string): Promise<void> {
    await this.store.write(artifact, payload);
  }
}
