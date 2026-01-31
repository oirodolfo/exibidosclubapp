import { Injectable } from "@nestjs/common";
import type { WeakLabel } from "@exibidos/ml-contracts";

@Injectable()
export class WeakLabelStoreService {
  private readonly byImage = new Map<string, WeakLabel[]>();

  async write(labels: WeakLabel[]): Promise<void> {
    for (const l of labels) {
      const list = this.byImage.get(l.imageId) ?? [];
      list.push(l);
      this.byImage.set(l.imageId, list);
    }
  }

  async getByImage(imageId: string): Promise<WeakLabel[]> {
    return this.byImage.get(imageId) ?? [];
  }

  async listImageIds(limit = 10_000): Promise<string[]> {
    return Array.from(this.byImage.keys()).slice(0, limit);
  }

  async count(): Promise<number> {
    let n = 0;
    for (const list of this.byImage.values()) n += list.length;
    return n;
  }
}
