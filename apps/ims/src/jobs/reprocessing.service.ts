import { Injectable } from "@nestjs/common";
import { ImagesService } from "../images/images.service";
import { ModerationService } from "../moderation/moderation.service";
import { JobsProducerService } from "./jobs-producer.service";
@Injectable()
export class ReprocessingService {
  constructor(
    private readonly images: ImagesService,
    private readonly moderation: ModerationService,
    private readonly producer: JobsProducerService
  ) {}

  async reprocessImagesByModelVersion(modelVersion: string): Promise<number> {
    const images = await this.images.listImagesByModelVersion(modelVersion);
    let count = 0;
    for (const img of images) {
      const decision = this.moderation.decideImagePolicy({
        imageId: img.id,
        originalKey: img.storageKey,
      });
      await this.images.updateModeration(
        img.id,
        decision.moderationStatus,
        decision.modelVersion
      );
      await this.producer.emitJob({
        imageId: img.id,
        originalKey: img.storageKey,
        actions: decision.actions,
        policyResult: {
          moderationStatus: decision.moderationStatus,
          modelVersion: decision.modelVersion,
        },
        modelVersion: decision.modelVersion,
      });
      count += 1;
    }
    return count;
  }
}
