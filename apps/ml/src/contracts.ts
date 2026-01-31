/**
 * ML → IMS metadata contract (long-lived, versioned).
 * Used at upload: ML runs ONCE; metadata is persisted and reused by IMS.
 */

export const ML_METADATA_CONTRACT_VERSION = 1;

/** Normalized 0–1 region: left, top, width, height */
export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Region with optional confidence 0–1 */
export interface RegionWithConfidence extends Region {
  confidence?: number;
}

/** Saliency: where the "focus" of the image is (e.g. for smart crop) */
export interface SaliencySignal {
  /** Center of interest, 0–1 */
  centerX: number;
  centerY: number;
  /** Weight or radius of interest */
  weight?: number;
}

export interface ImageMlMetadataData {
  /** Contract version for replay/validation */
  contractVersion: number;
  /** Face bounding boxes (confidence per face) */
  faceRegions: RegionWithConfidence[];
  /** Body/pose regions */
  bodyRegions: RegionWithConfidence[];
  /** Areas of interest (e.g. salient objects) */
  interestRegions: RegionWithConfidence[];
  /** Explicit or sensitive regions (to blur or hide) */
  explicitRegions: RegionWithConfidence[];
  /** Saliency signals for crop centering */
  saliency: SaliencySignal[];
}

/** Empty metadata for new images until ML runs */
export function emptyMlMetadata(contractVersion = ML_METADATA_CONTRACT_VERSION): ImageMlMetadataData {
  return {
    contractVersion,
    faceRegions: [],
    bodyRegions: [],
    interestRegions: [],
    explicitRegions: [],
    saliency: [],
  };
}
