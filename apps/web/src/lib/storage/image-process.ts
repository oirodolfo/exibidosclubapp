import sharp from "sharp";
import { buildStorageKey, extFromMime } from "./s3";
import { upload } from "./provider";
import { applyWatermark } from "./watermark";
import { detectFaces, type FaceResult } from "@/lib/face-detection";
import { log } from "@/lib/logger";

// --- Thumbnail: max width (height auto), JPEG quality ---
const THUMB_MAX_WIDTH = 400;
const THUMB_QUALITY = 85;

// --- Blur preview: max width, Gaussian sigma, JPEG quality (lower than thumb for size) ---
const BLUR_SIGMA = 12;
const BLUR_MAX_WIDTH = 800;
const BLUR_PREVIEW_QUALITY = 70;

// --- Face/region blur: sigma for extracted patches; JPEG quality when compositing ---
const FACE_BLUR_SIGMA = 20;
const FACE_BLUR_JPEG_QUALITY = 90;

export type BlurMode = "none" | "eyes" | "full";

/**
 * Blur face (or eyes-only) regions on a resized image.
 * Scales detection boxes to target dimensions, extracts patches, blurs, composites back.
 */
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
        .jpeg({ quality: FACE_BLUR_JPEG_QUALITY })
        .toBuffer();
      composites.push({ input: patch, top, left });
    }
  }
  if (composites.length === 0) return baseBuffer;
  return sharp(baseBuffer).composite(composites).jpeg({ quality: THUMB_QUALITY }).toBuffer();
}

/**
 * Process uploaded image: store original, generate thumb + blur preview with optional face blur and watermark.
 * Uses S3 or local storage according to provider. ML metadata is ingested separately after create.
 */
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

  log.storage.upload.info("processImage: start", { userId, imageId, mime, blurMode });

  const meta = await sharp(buffer).metadata();
  const origW = meta.width ?? 0;
  const origH = meta.height ?? 0;

  await upload(originalKey, buffer, mime);

  let faces: FaceResult[] = [];
  if (blurMode !== "none" || process.env.FEATURE_FACE_BLUR === "true") {
    faces = await detectFaces(buffer);
    log.storage.face.debug("processImage: face detection", { count: faces.length });
  }

  const thumbBase = await sharp(buffer)
    .resize(THUMB_MAX_WIDTH, undefined, { withoutEnlargement: true })
    .jpeg({ quality: THUMB_QUALITY })
    .toBuffer();
  const thumbMeta = await sharp(thumbBase).metadata();
  const thumbW = thumbMeta.width ?? origW;
  const thumbH = thumbMeta.height ?? origH;
  let thumbBuffer =
    blurMode !== "none" && faces.length > 0
      ? await applyFaceBlur(thumbBase, faces, origW, origH, thumbW, thumbH, blurMode)
      : thumbBase;
  thumbBuffer = await applyWatermark(thumbBuffer, thumbW, thumbH, THUMB_QUALITY);
  const thumbKey = buildStorageKey(userId, imageId, "thumb", "jpg");
  await upload(thumbKey, thumbBuffer, "image/jpeg");

  const blurBase = await sharp(buffer)
    .resize(BLUR_MAX_WIDTH, undefined, { withoutEnlargement: true })
    .blur(BLUR_SIGMA)
    .jpeg({ quality: BLUR_PREVIEW_QUALITY })
    .toBuffer();
  const blurMeta = await sharp(blurBase).metadata();
  const blurW = blurMeta.width ?? origW;
  const blurH = blurMeta.height ?? origH;
  let blurBuffer =
    blurMode !== "none" && faces.length > 0
      ? await applyFaceBlur(blurBase, faces, origW, origH, blurW, blurH, blurMode)
      : blurBase;
  blurBuffer = await applyWatermark(blurBuffer, blurW, blurH, BLUR_PREVIEW_QUALITY);
  const blurKey = buildStorageKey(userId, imageId, "blur", "jpg");
  await upload(blurKey, blurBuffer, "image/jpeg");

  log.storage.upload.info("processImage: done", { imageId, blurSuggested: faces.length > 0 });

  return {
    storageKey: originalKey,
    thumbKey,
    blurKey,
    width: origW || undefined,
    height: origH || undefined,
    blurSuggested: faces.length > 0,
  };
}
