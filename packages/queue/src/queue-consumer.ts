import { Inject, Injectable, OnModuleDestroy } from "@nestjs/common";
import { Worker } from "bullmq";
import Redis from "ioredis";

export const QUEUE_CONSUMER_OPTIONS = "QUEUE_CONSUMER_OPTIONS";

export interface QueueConsumerOptions {
  redisUrl: string;
}

export interface JobContext<T = unknown> {
  id: string;
  name: string;
  data: T;
}

export type JobProcessor<T = unknown> = (context: JobContext<T>) => Promise<void>;

/**
 * SQS-style consumer: register a handler for a queue, process messages.
 * BullMQ implementation: Worker per queue.
 */
@Injectable()
export class QueueConsumer implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly workers = new Map<string, Worker>();
  private readonly processors = new Map<string, JobProcessor>();

  constructor(
    @Inject(QUEUE_CONSUMER_OPTIONS) private readonly options: QueueConsumerOptions
  ) {
    this.redis = new Redis(this.options.redisUrl);
  }

  registerHandler<T = unknown>(
    queueName: string,
    processor: JobProcessor<T>
  ): void {
    if (this.processors.has(queueName)) {
      throw new Error(`Queue ${queueName} already has a handler registered`);
    }
    this.processors.set(queueName, processor as JobProcessor);
    const worker = new Worker(
      queueName,
      async (job) => {
        const fn = this.processors.get(queueName);
        if (!fn) return;
        await fn({
          id: job.id ?? "",
          name: job.name,
          data: job.data,
        });
      },
      { connection: this.redis }
    );
    worker.on("completed", (job) => {
      console.log(`[queue] job ${job.id} completed (${queueName})`);
    });
    worker.on("failed", (job, err) => {
      console.error(`[queue] job ${job?.id} failed (${queueName})`, err);
    });
    this.workers.set(queueName, worker);
  }

  async onModuleDestroy(): Promise<void> {
    for (const w of this.workers.values()) {
      await w.close();
    }
    this.workers.clear();
    this.processors.clear();
    await this.redis.quit();
  }
}
