import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { canonicalPayload } from "@exibidos/ml-contracts";
import type { DatasetArtifact } from "@exibidos/ml-contracts";
import { LabelStudioClientService, type LabelStudioConfig } from "./label-studio-client.service.js";
import { TaxonomyValidatorService } from "./taxonomy-validator.service.js";
import { DatasetArtifactService } from "./dataset-artifact.service.js";
import { InMemoryDatasetStoreService } from "./in-memory-dataset-store.service.js";

export const DATASET_READY_EVENT = "ml.dataset.ready";

@Injectable()
export class IngestionJobService {
  private lastSeenUpdatedAt: string | null = null;
  private config: LabelStudioConfig | null = null;

  constructor(
    private readonly labelStudio: LabelStudioClientService,
    private readonly validator: TaxonomyValidatorService,
    private readonly artifactService: DatasetArtifactService,
    private readonly store: InMemoryDatasetStoreService,
    private readonly events: EventEmitter2
  ) {}

  setConfig(config: LabelStudioConfig): void {
    this.config = config;
  }

  setLastSeenUpdatedAt(value: string | null): void {
    this.lastSeenUpdatedAt = value;
  }

  async run(): Promise<{ ok: true; artifact: DatasetArtifact } | { ok: false; reason: string }> {
    if (!this.config) {
      return { ok: false, reason: "Label Studio config not set" };
    }

    const raw = await this.labelStudio.fetchExport(this.config);
    const validated = this.validator.validate(raw);
    if (!validated.ok) {
      return { ok: false, reason: validated.reason };
    }

    const export_ = validated.export_;
    if (!this.labelStudio.hasNewOrUpdatedAnnotations(export_, this.lastSeenUpdatedAt)) {
      return { ok: false, reason: "No new or updated annotations; skipping." };
    }

    const artifact = this.artifactService.createArtifact(export_);
    const payload = canonicalPayload(export_);

    try {
      await this.store.write(artifact, payload);
    } catch (e) {
      if ((e as Error).message?.includes("already exists")) {
        return { ok: false, reason: `Dataset version ${artifact.dataset_version} already exists.` };
      }
      throw e;
    }

    this.events.emit(DATASET_READY_EVENT, { artifact, payload });
    return { ok: true, artifact };
  }
}
