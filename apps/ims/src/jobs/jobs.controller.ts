import { Body, Controller, Post } from "@nestjs/common";
import { ImagesService } from "../images/images.service";
import { ModerationService } from "../moderation/moderation.service";
import { JobsProducerService } from "./jobs-producer.service";
import { ReprocessingService } from "./reprocessing.service";

@Controller("jobs")
export class JobsController {
  constructor(
    private readonly images: ImagesService,
    private readonly moderation: ModerationService,
    private readonly producer: JobsProducerService,
    private readonly reprocessing: ReprocessingService
  ) {}

  @Post("process")
  async processImage(
    @Body("imageId") imageId: string
  ): Promise<{ jobId: string }> {
    const metadata = await this.images.getImageMetadata(imageId);
    if (!metadata) {
      throw new Error("Image not found");
    }
    const decision = this.moderation.decideImagePolicy({
      imageId: metadata.id,
      originalKey: metadata.storageKey,
    });
    await this.images.updateModeration(
      metadata.id,
      decision.moderationStatus,
      decision.modelVersion
    );
    const jobId = await this.producer.emitJob({
      imageId: metadata.id,
      originalKey: metadata.storageKey,
      actions: decision.actions,
      policyResult: {
        moderationStatus: decision.moderationStatus,
        modelVersion: decision.modelVersion,
      },
      modelVersion: decision.modelVersion,
    });
    return { jobId };
  }

  @Post("reprocess")
  async reprocess(
    @Body("modelVersion") modelVersion: string
  ): Promise<{ count: number }> {
    const count = await this.reprocessing.reprocessImagesByModelVersion(
      modelVersion
    );
    return { count };
  }
}
