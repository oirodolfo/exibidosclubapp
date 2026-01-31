import sharp from "sharp";
import { buildStorageKey, extFromMime, uploadToS3 } from "./s3";
import { detectFaces, type FaceResult } from "@/lib/face-detection";

const THUMB_MAX_WIDTH = 400;
const THUMB_QUALITY = 85;
const BLUR_SIGMA = 12;
const BLUR_MAX_WIDTH = 800;
const FACE_BLUR_SIGMA = 20;

export type BlurMode = "none" | "eyes" | "full";

async function applyFaceBlur(
  baseBuffer: Buffer,
  faces: FaceResult[],
  origW: number,
  origH: number,
  targetW: number,
  targetH: number,
  blurMode: BlurMode
): Promise<Buffer> {
  if (faces.length === 0) return baseBuffer;
  const scaleX = targetW / origW;
  const scaleY = targetH / origH;
  const composites: { input: Buffer; top: number; left: number }[] = [];
  for (const face of faces) {
    const regions = blurMode === "eyes" && face.eyes ? face.eyes : [face.box];
    for (const r of regions) {
      const left = Math.max(0, Math.floor(r.x * scaleX));
      const top = Math.max(0, Math.floor(r.y * scaleY));
      const w = Math.min(targetW - left, Math.ceil(r.width * scaleX));
      const h = Math.min(targetH - top, Math.ceil(r.height * scaleY));
      if (w <= 0 || h <= 0) continue;
      const patch = await sharp(baseBuffer)
        .extract({ left, top, width: w, height: h })
        .blur(FACE_BLUR_SIGMA)
        .jpeg({ quality: 90 })
        .toBuffer();
      composites.push({ input: patch, top, left });
    }
  }
  if (composites.length === 0) return baseBuffer;
  return sharp(baseBuffer).composite(composites).jpeg({ quality: THUMB_QUALITY }).toBuffer();
}

export async function processImage(
  userId: string,
  imageId: string,
  buffer: Buffer,
  mime: string,
  blurMode: BlurMode = "none"
): Promise<{
  storageKey: string;
  thumbKey: string;
  blurKey: string;
  width?: number;
  height?: number;
  blurSuggested: boolean;
}> {
  const ext = extFromMime(mime);
  const originalKey = buildStorageKey(userId, imageId, "original", ext);

  const meta = await sharp(buffer).metadata();
  const origW = meta.width ?? 0;
  const origH = meta.height ?? 0;

  await uploadToS3(originalKey, buffer, mime);

  let faces: FaceResult[] = [];
  if (blurMode !== "none" || process.env.FEATURE_FACE_BLUR === "true") {
    faces = await detectFaces(buffer);
  }

  const thumbBase = await sharp(buffer)
    .resize(THUMB_MAX_WIDTH, undefined, { withoutEnlargement: true })
    .jpeg({ quality: THUMB_QUALITY })
    .toBuffer();
  const thumbMeta = await sharp(thumbBase).metadata();
  const thumbW = thumbMeta.width ?? origW;
  const thumbH = thumbMeta.height ?? origH;
  const thumbBuffer =
    blurMode !== "none" && faces.length > 0
      ? await applyFaceBlur(thumbBase, faces, origW, origH, thumbW, thumbH, blurMode)
      : thumbBase;
  const thumbKey = buildStorageKey(userId, imageId, "thumb", "jpg");
  await uploadToS3(thumbKey, thumbBuffer, "image/jpeg");

  const blurBase = await sharp(buffer)
    .resize(BLUR_MAX_WIDTH, undefined, { withoutEnlargement: true })
    .blur(BLUR_SIGMA)
    .jpeg({ quality: 70 })
    .toBuffer();
  const blurMeta = await sharp(blurBase).metadata();
  const blurW = blurMeta.width ?? origW;
  const blurH = blurMeta.height ?? origH;
  const blurBuffer =
    blurMode !== "none" && faces.length > 0
      ? await applyFaceBlur(blurBase, faces, origW, origH, blurW, blurH, blurMode)
      : blurBase;
  const blurKey = buildStorageKey(userId, imageId, "blur", "jpg");
  await uploadToS3(blurKey, blurBuffer, "image/jpeg");

  return {
    storageKey: originalKey,
    thumbKey,
    blurKey,
    width: origW || undefined,
    height: origH || undefined,
    blurSuggested: faces.length > 0,
  };
}
