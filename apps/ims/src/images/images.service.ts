import { Injectable } from "@nestjs/common";
import { prisma } from "@exibidos/db/client";
import { ModerationStatus } from "@exibidos/image-contracts";

const STATUS_MAP: Record<ModerationStatus, string> = {
  [ModerationStatus.Pending]: "pending",
  [ModerationStatus.Safe]: "approved",
  [ModerationStatus.NeedsBlur]: "approved",
  [ModerationStatus.Blocked]: "rejected",
  [ModerationStatus.Review]: "queued",
};

@Injectable()
export class ImagesService {
  async updateModeration(
    imageId: string,
    moderationStatus: ModerationStatus,
    modelVersion: string
  ): Promise<void> {
    await prisma.image.update({
      where: { id: imageId },
      data: {
        moderationStatus: STATUS_MAP[moderationStatus],
        moderationNote: modelVersion,
      },
    });
  }

  async getImageMetadata(imageId: string): Promise<{
    id: string;
    storageKey: string;
    userId: string;
  } | null> {
    const image = await prisma.image.findUnique({
      where: { id: imageId, deletedAt: null },
      select: { id: true, storageKey: true, userId: true },
    });
    return image;
  }

  async listImagesByModelVersion(modelVersion: string): Promise<
    { id: string; storageKey: string; userId: string }[]
  > {
    const images = await prisma.image.findMany({
      where: { moderationNote: modelVersion, deletedAt: null },
      select: { id: true, storageKey: true, userId: true },
      take: 1000,
    });
    return images;
  }
}
