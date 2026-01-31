/**
 * Ingest ML metadata for an image (long-lived contract).
 * On upload we run ML analysis ONCE and persist; no inference inside IMS requests.
 * Stub: persists empty metadata until real ML pipeline is connected.
 */

import { prisma } from "@exibidos/db/client";
import {
  emptyMlMetadata,
  ML_METADATA_CONTRACT_VERSION,
  type ImageMlMetadataData,
} from "@exibidos/ml";

/** Persist ML metadata for image (idempotent upsert by imageId). */
export async function ingestMlMetadata(
  imageId: string,
  data: ImageMlMetadataData
): Promise<void> {
  await prisma.imageMlMetadata.upsert({
    where: { imageId },
    create: {
      imageId,
      contractVersion: data.contractVersion,
      data: data as unknown as object,
    },
    update: {
      contractVersion: data.contractVersion,
      data: data as unknown as object,
    },
  });
}

/**
 * Ensure ML metadata exists for image (run after upload).
 * Currently stub: stores empty metadata; replace with real ML job when available.
 */
export async function ensureMlMetadataForImage(imageId: string): Promise<void> {
  const existing = await prisma.imageMlMetadata.findUnique({
    where: { imageId },
  });
  if (existing) return;

  const stub = emptyMlMetadata(ML_METADATA_CONTRACT_VERSION);
  await ingestMlMetadata(imageId, stub);
}
