import type { ImageAction } from "./actions";
import type { ModerationStatus } from "./moderation";

export interface PolicyResult {
  moderationStatus: ModerationStatus;
  modelVersion: string;
}

export interface ImageProcessingJob {
  jobId: string;
  imageId: string;
  originalKey: string;
  actions: ImageAction[];
  policyResult: PolicyResult;
  modelVersion: string;
  createdAt: string;
}
