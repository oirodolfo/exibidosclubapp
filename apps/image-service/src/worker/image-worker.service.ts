import { Injectable, OnModuleInit } from "@nestjs/common";
import {
  ImageProcessingJobSchema,
  type ImageProcessingJob,
} from "@exibidos/image-contracts";
import type { JobContext } from "@exibidos/queue";
import { QueueConsumer } from "@exibidos/queue";
import { R2Service } from "../r2/r2.service";
import { SharpPipelineService } from "../sharp-pipeline/sharp-pipeline.service";

const QUEUE_NAME = "image-processing";

@Injectable()
export class ImageWorkerService implements OnModuleInit {
  constructor(
    private readonly queueConsumer: QueueConsumer,
    private readonly r2: R2Service,
    private readonly pipeline: SharpPipelineService
  ) {}

  onModuleInit(): void {
    this.queueConsumer.registerHandler<ImageProcessingJob>(
      QUEUE_NAME,
      (ctx) => this.processJob(ctx)
    );
  }

  private async processJob(ctx: JobContext<ImageProcessingJob>): Promise<void> {
    const parse = ImageProcessingJobSchema.safeParse(ctx.data);
    if (!parse.success) {
      throw new Error(`Invalid job payload: ${parse.error.message}`);
    }
    const payload = parse.data;
    const jobId = ctx.id || payload.jobId;
    console.log(`[worker] processing job ${jobId} imageId=${payload.imageId}`);
    const buffer = await this.r2.download(payload.originalKey);
    const result = await this.pipeline.execute(buffer, payload.actions);
    const variant = "main";
    const key = this.r2.processedKey(payload.imageId, variant);
    await this.r2.upload(key, result, "image/webp");
    console.log(`[worker] job ${jobId} uploaded ${key}`);
  }
}
