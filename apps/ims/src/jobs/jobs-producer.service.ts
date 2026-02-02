import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Queue } from "bullmq";
import Redis from "ioredis";
import {
  type ImageProcessingJob,
  type ImageAction,
  type PolicyResult,
} from "@exibidos/image-contracts";

const QUEUE_NAME = "image-processing";
const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

@Injectable()
export class JobsProducerService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly queue: Queue<ImageProcessingJob>;

  constructor() {
    this.redis = new Redis(REDIS_URL);
    this.queue = new Queue<ImageProcessingJob>(QUEUE_NAME, {
      connection: this.redis,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
    await this.redis.quit();
  }

  async emitJob(payload: {
    imageId: string;
    originalKey: string;
    actions: ImageAction[];
    policyResult: PolicyResult;
    modelVersion: string;
  }): Promise<string> {
    const jobId = crypto.randomUUID();
    const job: ImageProcessingJob = {
      jobId,
      imageId: payload.imageId,
      originalKey: payload.originalKey,
      actions: payload.actions,
      policyResult: payload.policyResult,
      modelVersion: payload.modelVersion,
      createdAt: new Date().toISOString(),
    };
    await this.queue.add("process", job, { jobId });
    return jobId;
  }
}
