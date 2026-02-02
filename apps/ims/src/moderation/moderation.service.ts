import { Injectable } from "@nestjs/common";
import {
  ModerationStatus,
  type ImageAction,
} from "@exibidos/image-contracts";

export interface ImageMetadata {
  imageId: string;
  originalKey: string;
  width?: number;
  height?: number;
  mimeType?: string;
}

export interface PolicyDecision {
  moderationStatus: ModerationStatus;
  actions: ImageAction[];
  modelVersion: string;
}

const MODEL_VERSION = "ims-v1-deterministic";

@Injectable()
export class ModerationService {
  decideImagePolicy(_metadata: ImageMetadata): PolicyDecision {
    const status = ModerationStatus.Safe;
    const actions = this.getActionsForStatus(status);
    return {
      moderationStatus: status,
      actions,
      modelVersion: MODEL_VERSION,
    };
  }

  private getActionsForStatus(status: ModerationStatus): ImageAction[] {
    switch (status) {
      case ModerationStatus.Safe:
        return [
          { kind: "resize", width: 1200 },
          { kind: "thumb", width: 400 },
          { kind: "convert", format: "webp" },
        ];
      case ModerationStatus.NeedsBlur:
        return [
          { kind: "resize", width: 1200 },
          { kind: "thumb", width: 400 },
          { kind: "blur", radius: 40 },
          { kind: "convert", format: "webp" },
        ];
      case ModerationStatus.Blocked:
        return [];
      case ModerationStatus.Pending:
      case ModerationStatus.Review:
        return [];
      default:
        return [];
    }
  }
}
