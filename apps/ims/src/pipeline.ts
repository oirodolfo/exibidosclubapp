/**
 * IMS pipeline: fetch → resize → optimize → encode.
 * Order is fixed for deterministic output. Never serves original.
 */

import sharp from "sharp";
import type { TransformSpec } from "./contracts.js";

export interface PipelineInput {
  buffer: Buffer;
  contentType: string;
  spec: TransformSpec;
}

export interface PipelineResult {
  buffer: Buffer;
  contentType: string;
}

/** Transformation order: 1) resize 2) optimize 3) encode. No crop/blur/watermark in Stage 1. */
export async function runPipeline(input: PipelineInput): Promise<PipelineResult> {
  const { buffer, spec } = input;

  let pipeline = sharp(buffer);

  const meta = await pipeline.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  const targetW = spec.w ?? width;
  const targetH = spec.h ?? height;

  if (targetW > 0 && targetH > 0 && (targetW < width || targetH < height)) {
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
