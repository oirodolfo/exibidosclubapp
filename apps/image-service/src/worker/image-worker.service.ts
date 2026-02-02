import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Worker } from "bullmq";
import Redis from "ioredis";
import {
  ImageProcessingJobSchema,
  type ImageProcessingJob,
} from "@exibidos/image-contracts";
import { R2Service } from "../r2/r2.service";
import { SharpPipelineService } from "../sharp-pipeline/sharp-pipeline.service";

const QUEUE_NAME = "image-processing";
const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

@Injectable()
export class ImageWorkerService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  private worker: Worker<ImageProcessingJob, void>;

  constructor(
    private readonly r2: R2Service,
    private readonly pipeline: SharpPipelineService
  ) {
    this.redis = new Redis(REDIS_URL);
    this.worker = new Worker<ImageProcessingJob>(
      QUEUE_NAME,
      async (job) => this.processJob(job),
      { connection: this.redis }
    );
  }

  async onModuleInit(): Promise<void> {
    this.worker.on("completed", (job) => {
      console.log(`[worker] job ${job.id} completed`);
    });
    this.worker.on("failed", (job, err) => {
      console.error(`[worker] job ${job?.id} failed`, err);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker.close();
    await this.redis.quit();
  }

  private async processJob(
    job: { id?: string; data: ImageProcessingJob }
  ): Promise<void> {
    const parse = ImageProcessingJobSchema.safeParse(job.data);
    if (!parse.success) {
      throw new Error(`Invalid job payload: ${parse.error.message}`);
    }
    const payload = parse.data;
    const jobId = job.id ?? payload.jobId;
    console.log(`[worker] processing job ${jobId} imageId=${payload.imageId}`);
    const buffer = await this.r2.download(payload.originalKey);
    const result = await this.pipeline.execute(buffer, payload.actions);
    const variant = "main";
    const key = this.r2.processedKey(payload.imageId, variant);
    await this.r2.upload(key, result, "image/webp");
    console.log(`[worker] job ${jobId} uploaded ${key}`);
  }
}
