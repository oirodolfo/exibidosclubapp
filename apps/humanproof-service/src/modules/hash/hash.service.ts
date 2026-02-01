import { Injectable } from "@nestjs/common";
import type {
  ApprovedImageHashRepository,
  RejectedImageHashRepository,
} from "../../application/ports/image-hash.repository";
import { HumanproofConfigService } from "../../config/humanproof-config.service";
import { dHashFromBuffer } from "../../shared/perceptual-hash";

export interface HashCheckResult {
  readonly accepted: boolean;
  readonly hash: string;
  readonly failureReasons: readonly string[];
}

@Injectable()
export class HashService {
  constructor(
    private readonly approved: ApprovedImageHashRepository,
    private readonly rejected: RejectedImageHashRepository,
    private readonly config: HumanproofConfigService
  ) {}

  async checkImage(buffer: Buffer, userId: string): Promise<HashCheckResult> {
    const hash = await dHashFromBuffer(buffer);
    const threshold = this.config.hashSimilarityThreshold;
    const reasons: string[] = [];

    const similarRejected = await this.rejected.hasSimilar(hash, threshold);
    if (similarRejected) {
      reasons.push("Image too similar to a previously rejected image");
    }

    const similarApproved = await this.approved.hasSimilar(hash, threshold);
    if (similarApproved) {
      reasons.push("Image too similar to an already used image (reuse)");
    }

    const accepted = reasons.length === 0;
    if (accepted) {
      await this.approved.add(hash, userId, new Date());
    } else {
      await this.rejected.add(
        hash,
        reasons.join("; ") ?? "similarity",
        new Date()
      );
    }

    return {
      accepted,
      hash,
      failureReasons: reasons,
    };
  }
}
