import { Injectable } from "@nestjs/common";
import { QueueProducer } from "@exibidos/queue";
import {
  type ImageProcessingJob,
  type ImageAction,
  type PolicyResult,
} from "@exibidos/image-contracts";

const QUEUE_NAME = "image-processing";

@Injectable()
export class JobsProducerService {
  constructor(private readonly queueProducer: QueueProducer) {}

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
    return this.queueProducer.sendMessage(QUEUE_NAME, "process", job, {
      jobId,
    });
  }
}
