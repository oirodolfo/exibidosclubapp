import {
  ApprovedImageHashRepository,
  RejectedImageHashRepository,
} from "../../application/ports/image-hash.repository";
import { hammingDistance } from "../../shared/perceptual-hash";

type Entry = { hash: string; at: Date; userId?: string; reason?: string };

export class InMemoryApprovedImageHashRepository
  extends ApprovedImageHashRepository
{
  private readonly store: Entry[] = [];

  async add(hash: string, userId: string, at: Date): Promise<void> {
    this.store.push({ hash, userId, at });
  }

  async hasSimilar(hash: string, threshold: number): Promise<boolean> {
    for (const e of this.store) {
      if (hammingDistance(hash, e.hash) <= threshold) return true;
    }
    return false;
  }

  async listByUser(userId: string): Promise<readonly string[]> {
    return this.store
      .filter((e) => e.userId === userId)
      .map((e) => e.hash);
  }
}

export class InMemoryRejectedImageHashRepository
  extends RejectedImageHashRepository
{
  private readonly store: Entry[] = [];

  async add(hash: string, reason: string, at: Date): Promise<void> {
    this.store.push({ hash, reason, at });
  }

  async hasSimilar(hash: string, threshold: number): Promise<boolean> {
    for (const e of this.store) {
      if (hammingDistance(hash, e.hash) <= threshold) return true;
    }
    return false;
  }
}
