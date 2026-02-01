import { Injectable } from "@nestjs/common";
import { WeakLabelStoreService } from "./weak-label-store.service";

export interface WeakLabelStats {
  totalLabels: number;
  bySource: Record<string, number>;
  imageCount: number;
  sampledImageIds: string[];
}

@Injectable()
export class WeakLabelStatsService {
  constructor(private readonly store: WeakLabelStoreService) {}

  async getStats(sampleSize = 100): Promise<WeakLabelStats> {
    const imageIds = await this.store.listImageIds(sampleSize);
    const bySource: Record<string, number> = {};

    for (const imageId of imageIds) {
      const labels = await this.store.getByImage(imageId);
      for (const l of labels) {
        bySource[l.source] = (bySource[l.source] ?? 0) + 1;
      }
    }

    const allIds = await this.store.listImageIds(10_000);
    return {
      totalLabels: await this.store.count(),
      bySource,
      imageCount: allIds.length,
      sampledImageIds: imageIds,
    };
  }
}
