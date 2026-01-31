/**
 * IMS pipeline: fetch → crop (optional) → resize → optimize → encode.
 * Order is fixed for deterministic output. Never serves original.
 */

import type { ImageMlMetadataData } from "@exibidos/ml";
import sharp from "sharp";
import type { TransformSpec } from "./contracts.js";
import { computeCropRegion } from "./crop-engine.js";

export interface PipelineInput {
  buffer: Buffer;
  contentType: string;
  spec: TransformSpec;
  /** When spec.crop is set, ML metadata for intelligent crop; null = fallback to center */
  mlMetadata?: ImageMlMetadataData | null;
}

export interface PipelineResult {
  buffer: Buffer;
  contentType: string;
}

/** Transformation order: 1) crop (if spec.crop) 2) resize 3) encode. */
export async function runPipeline(input: PipelineInput): Promise<PipelineResult> {
  const { buffer, spec, mlMetadata } = input;

  let pipeline = sharp(buffer);

  const meta = await pipeline.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  const targetW = spec.w ?? width;
  const targetH = spec.h ?? height;

  let wAfter = width;
  let hAfter = height;

  if (spec.crop && width > 0 && height > 0 && targetW > 0 && targetH > 0) {
    const region = computeCropRegion(
      spec.crop,
      width,
      height,
      targetW,
      targetH,
      mlMetadata ?? null
    );
    const fallback = computeCropRegion("center", width, height, targetW, targetH, null);
    const cropBox = region ?? fallback;
    if (cropBox) {
      pipeline = pipeline.extract({
        left: cropBox.left,
        top: cropBox.top,
        width: cropBox.width,
        height: cropBox.height,
      });
      wAfter = cropBox.width;
      hAfter = cropBox.height;
    }
  }

  if (targetW > 0 && targetH > 0 && (targetW < wAfter || targetH < hAfter)) {
    pipeline = pipeline.resize(targetW, targetH, {
      fit: spec.fit,
      withoutEnlargement: true,
    });
  }

  const contentType = spec.fmt === "webp" ? "image/webp" : "image/jpeg";

  if (spec.fmt === "webp") {
    const out = await pipeline.webp({ quality: spec.q }).toBuffer();
    return { buffer: out, contentType };
  }

  const out = await pipeline.jpeg({ quality: spec.q }).toBuffer();
  return { buffer: out, contentType };
}
