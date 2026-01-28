import sharp from "sharp";
import { buildStorageKey, extFromMime, uploadToS3 } from "./s3";

const THUMB_MAX_WIDTH = 400;
const THUMB_QUALITY = 85;
const BLUR_SIGMA = 12;
const BLUR_MAX_WIDTH = 800;

export async function processImage(
  userId: string,
  imageId: string,
  buffer: Buffer,
  mime: string
): Promise<{ storageKey: string; thumbKey: string; blurKey: string; width?: number; height?: number }> {
  const ext = extFromMime(mime);
  const originalKey = buildStorageKey(userId, imageId, "original", ext);

  const meta = await sharp(buffer).metadata();
  const width = meta.width ?? undefined;
  const height = meta.height ?? undefined;

  await uploadToS3(originalKey, buffer, mime);

  const thumbBuffer = await sharp(buffer)
    .resize(THUMB_MAX_WIDTH, undefined, { withoutEnlargement: true })
    .jpeg({ quality: THUMB_QUALITY })
    .toBuffer();
  const thumbKey = buildStorageKey(userId, imageId, "thumb", "jpg");
  await uploadToS3(thumbKey, thumbBuffer, "image/jpeg");

  const blurBuffer = await sharp(buffer)
    .resize(BLUR_MAX_WIDTH, undefined, { withoutEnlargement: true })
    .blur(BLUR_SIGMA)
    .jpeg({ quality: 70 })
    .toBuffer();
  const blurKey = buildStorageKey(userId, imageId, "blur", "jpg");
  await uploadToS3(blurKey, blurBuffer, "image/jpeg");

  return {
    storageKey: originalKey,
    thumbKey,
    blurKey,
    width,
    height,
  };
}
