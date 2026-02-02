import { Inject, Injectable, OnModuleDestroy } from "@nestjs/common";
import { Queue } from "bullmq";
import Redis from "ioredis";

export const QUEUE_PRODUCER_OPTIONS = "QUEUE_PRODUCER_OPTIONS";

export interface QueueProducerOptions {
  redisUrl: string;
}

export interface SendMessageOptions {
  /** SQS-style: optional deduplication id */
  messageDeduplicationId?: string;
  /** Optional job id (BullMQ jobId) */
  jobId?: string;
}

/**
 * SQS-style producer: sendMessage(queueName, body) -> messageId.
 * BullMQ implementation: add job to named queue.
 */
@Injectable()
export class QueueProducer implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly queues = new Map<string, Queue>();

  constructor(
    @Inject(QUEUE_PRODUCER_OPTIONS) private readonly options: QueueProducerOptions
  ) {
    this.redis = new Redis(this.options.redisUrl);
  }

  async onModuleDestroy(): Promise<void> {
    for (const q of this.queues.values()) {
      await q.close();
    }
    this.queues.clear();
    await this.redis.quit();
  }

  private getQueue(name: string): Queue {
    let q = this.queues.get(name);
    if (!q) {
      q = new Queue(name, { connection: this.redis });
      this.queues.set(name, q);
    }
    return q;
  }

  /**
   * Add a job to the queue. Returns job id (message id).
   */
  async sendMessage<T = unknown>(
    queueName: string,
    jobName: string,
    body: T,
    opts?: SendMessageOptions
  ): Promise<string> {
    const queue = this.getQueue(queueName);
    const job = await queue.add(jobName, body, {
      jobId: opts?.jobId ?? opts?.messageDeduplicationId,
    });
    return job.id ?? String(job.id);
  }
}
