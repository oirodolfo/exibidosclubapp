/**
 * Intelligent crop engine: ML-aware crop with safe fallback.
 * Crop by face, body, interest, explicit region; fallback when confidence is low.
 * Designed for A/B testing of crop strategies and future personalization.
 */

import type { ImageMlMetadataData, RegionWithConfidence, SaliencySignal } from "@exibidos/ml";
import type { CropMode } from "./contracts.js";

const MIN_CONFIDENCE = 0.5;

/** Crop region in pixels (for sharp.extract) */
export interface CropRegion {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Pick best region by confidence (highest first); return pixel box.
 * Normalized coords are 0–1; image is width x height.
 */
function regionToPixels(
  region: RegionWithConfidence,
  imageWidth: number,
  imageHeight: number
): CropRegion {
  const left = Math.round(region.x * imageWidth);
  const top = Math.round(region.y * imageHeight);
  const width = Math.round(region.w * imageWidth);
  const height = Math.round(region.h * imageHeight);
  return {
    left: Math.max(0, left),
    top: Math.max(0, top),
    width: Math.min(width, imageWidth - left),
    height: Math.min(height, imageHeight - top),
  };
}

/** Center crop to fit target aspect ratio */
function centerCrop(
  imageWidth: number,
  imageHeight: number,
  targetW: number,
  targetH: number
): CropRegion {
  const targetRatio = targetW / targetH;
  const imageRatio = imageWidth / imageHeight;
  let width: number;
  let height: number;
  if (imageRatio > targetRatio) {
    height = imageHeight;
    width = Math.round(imageHeight * targetRatio);
  } else {
    width = imageWidth;
    height = Math.round(imageWidth / targetRatio);
  }
  const left = Math.max(0, Math.round((imageWidth - width) / 2));
  const top = Math.max(0, Math.round((imageHeight - height) / 2));
  return { left, top, width, height };
}

/** Saliency center to pixel crop (expand to cover target aspect) */
function saliencyToCrop(
  saliency: SaliencySignal[],
  imageWidth: number,
  imageHeight: number,
  targetW: number,
  targetH: number
): CropRegion | null {
  if (saliency.length === 0) return null;
  const s = saliency[0]!;
  const targetRatio = targetW / targetH;
  const imageRatio = imageWidth / imageHeight;
  let width: number;
  let height: number;
  if (imageRatio > targetRatio) {
    height = imageHeight;
    width = Math.round(imageHeight * targetRatio);
  } else {
    width = imageWidth;
    height = Math.round(imageWidth / targetRatio);
  }
  const centerX = Math.round(s.centerX * imageWidth);
  const centerY = Math.round(s.centerY * imageHeight);
  let left = centerX - Math.round(width / 2);
  let top = centerY - Math.round(height / 2);
  left = Math.max(0, Math.min(left, imageWidth - width));
  top = Math.max(0, Math.min(top, imageHeight - height));
  return { left, top, width, height };
}

/**
 * Compute crop region for given mode and metadata.
 * Returns null to use center fallback (low confidence or no metadata).
 */
export function computeCropRegion(
  mode: CropMode,
  imageWidth: number,
  imageHeight: number,
  targetW: number,
  targetH: number,
  metadata: ImageMlMetadataData | null
): CropRegion | null {
  if (mode === "center") {
    return centerCrop(imageWidth, imageHeight, targetW, targetH);
  }

  if (!metadata) {
    return centerCrop(imageWidth, imageHeight, targetW, targetH);
  }

  const pickBest = (regions: RegionWithConfidence[]): RegionWithConfidence | null => {
    const valid = regions.filter((r) => (r.confidence ?? 1) >= MIN_CONFIDENCE);
    if (valid.length === 0) return null;
    valid.sort((a, b) => (b.confidence ?? 1) - (a.confidence ?? 1));
    return valid[0] ?? null;
  };

  switch (mode) {
    case "face": {
      const r = pickBest(metadata.faceRegions);
      return r ? regionToPixels(r, imageWidth, imageHeight) : null;
    }
    case "body": {
      const r = pickBest(metadata.bodyRegions);
      return r ? regionToPixels(r, imageWidth, imageHeight) : null;
    }
    case "interest": {
      const r = pickBest(metadata.interestRegions);
      if (r) return regionToPixels(r, imageWidth, imageHeight);
      return saliencyToCrop(
        metadata.saliency,
        imageWidth,
        imageHeight,
        targetW,
        targetH
      );
    }
    case "explicit": {
      const r = pickBest(metadata.explicitRegions);
      return r ? regionToPixels(r, imageWidth, imageHeight) : null;
    }
    default:
      return null;
  }
}
