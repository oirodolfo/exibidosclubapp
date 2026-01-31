import { Injectable } from "@nestjs/common";
import type { UserTagInput, VoteInput, SwipeInput, WeakLabel } from "@exibidos/ml-contracts";
import { WeakLabelNormalizerService } from "./weak-label-normalizer.service.js";
import { WeakLabelStoreService } from "./weak-label-store.service.js";

@Injectable()
export class WeakLabelIngestionService {
  constructor(
    private readonly normalizer: WeakLabelNormalizerService,
    private readonly store: WeakLabelStoreService
  ) {}

  /** Ingest user tags (never mix with ground truth). */
  async ingestUserTags(inputs: UserTagInput[]): Promise<number> {
    const now = new Date().toISOString();
    const labels: WeakLabel[] = inputs.map((i) => this.normalizer.normalizeUserTag(i, now));
    await this.store.write(labels);
    return labels.length;
  }

  /** Ingest votes. */
  async ingestVotes(inputs: VoteInput[]): Promise<number> {
    const now = new Date().toISOString();
    const labels: WeakLabel[] = inputs.map((i) => this.normalizer.normalizeVote(i, now));
    await this.store.write(labels);
    return labels.length;
  }

  /** Ingest swipes. */
  async ingestSwipes(inputs: SwipeInput[]): Promise<number> {
    const now = new Date().toISOString();
    const labels: WeakLabel[] = inputs.map((i) => this.normalizer.normalizeSwipe(i, now));
    await this.store.write(labels);
    return labels.length;
  }
}
