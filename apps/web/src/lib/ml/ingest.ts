/**
 * Ingest ML metadata for an image (long-lived contract).
 * On upload we run ML analysis ONCE and persist; no inference inside IMS requests.
 * Stage 11: Integrates face detection to populate faceRegions when buffer provided.
 */

import { prisma } from "@exibidos/db/client";
import {
  emptyMlMetadata,
  ML_METADATA_CONTRACT_VERSION,
  type ImageMlMetadataData,
  type RegionWithConfidence,
} from "@exibidos/ml-contracts";
import { detectFaces } from "@/lib/face-detection";

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
 * When buffer is provided and FEATURE_ML_PIPELINE/FEATURE_FACE_BLUR enabled,
 * runs face detection to populate faceRegions.
 */
export async function ensureMlMetadataForImage(
  imageId: string,
  buffer?: Buffer
): Promise<void> {
  const existing = await prisma.imageMlMetadata.findUnique({
    where: { imageId },
  });
  if (existing) return;

  let data: ImageMlMetadataData = emptyMlMetadata(ML_METADATA_CONTRACT_VERSION);

  if (
    buffer &&
    (process.env.FEATURE_ML_PIPELINE === "true" || process.env.FEATURE_FACE_BLUR === "true")
  ) {
    try {
      const faces = await detectFaces(buffer);
      const faceRegions: RegionWithConfidence[] = faces.map((f) => ({
        x: f.box.x,
        y: f.box.y,
        w: f.box.width,
        h: f.box.height,
        confidence: 0.8,
      }));
      data = { ...data, faceRegions };
    } catch {
      // keep empty metadata
    }
  }

  await ingestMlMetadata(imageId, data);
}
