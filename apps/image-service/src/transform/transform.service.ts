import { Injectable } from "@nestjs/common";
import type { ImageMlMetadataData } from "@exibidos/ml-contracts";
import sharp from "sharp";
import type { BlurMode, TransformSpec, WatermarkKind } from "./contracts.js";
import { BlurEngineService } from "./blur-engine.service.js";
import { CropStrategyService } from "./crop-strategy.service.js";
import { WatermarkEngineService } from "./watermark-engine.service.js";

export interface PipelineInput {
  buffer: Buffer;
  contentType: string;
  spec: TransformSpec;
  mlMetadata?: ImageMlMetadataData | null;
  blurMode?: BlurMode;
  watermarkKind?: WatermarkKind;
  watermarkSlug?: string;
}

export interface PipelineResult {
  buffer: Buffer;
  contentType: string;
}

@Injectable()
export class TransformService {
  constructor(
    private readonly cropStrategy: CropStrategyService,
    private readonly blurEngine: BlurEngineService,
    private readonly watermarkEngine: WatermarkEngineService
  ) {}

  async runPipeline(input: PipelineInput): Promise<PipelineResult> {
    const { buffer, spec, mlMetadata, blurMode, watermarkKind, watermarkSlug } = input;

    let pipeline = sharp(buffer);
    const meta = await pipeline.metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    const targetW = spec.w ?? width;
    const targetH = spec.h ?? height;

    let wAfter = width;
    let hAfter = height;

    if (spec.crop && width > 0 && height > 0 && targetW > 0 && targetH > 0) {
      const region = this.cropStrategy.computeCropRegion(
        spec.crop,
        width,
        height,
        targetW,
        targetH,
        mlMetadata ?? null
      );
      const fallback = this.cropStrategy.computeCropRegion("center", width, height, targetW, targetH, null);
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

    if (blurMode && blurMode !== "none") {
      const buf = await pipeline.toBuffer();
      const blurred = await this.blurEngine.applyBlur(buf, wAfter, hAfter, blurMode, mlMetadata ?? null);
      pipeline = sharp(blurred);
    }

    if (targetW > 0 && targetH > 0 && (targetW < wAfter || targetH < hAfter)) {
      pipeline = pipeline.resize(targetW, targetH, {
        fit: spec.fit,
        withoutEnlargement: true,
      });
    }

    let wOut = wAfter;
    let hOut = hAfter;
    if (targetW > 0 && targetH > 0) {
      wOut = targetW;
      hOut = targetH;
    }

    if (watermarkKind && watermarkKind !== "none") {
      const buf = await pipeline.toBuffer();
      const resizedMeta = await sharp(buf).metadata();
      const w = resizedMeta.width ?? wOut;
      const h = resizedMeta.height ?? hOut;
      const watermarked = await this.watermarkEngine.applyWatermark(
        buf,
        { kind: watermarkKind, userSlug: watermarkSlug, width: w, height: h },
        mlMetadata ?? null
      );
      pipeline = sharp(watermarked);
    }

    const contentType = spec.fmt === "webp" ? "image/webp" : "image/jpeg";

    if (spec.fmt === "webp") {
      const out = await pipeline.webp({ quality: spec.q }).toBuffer();
      return { buffer: out, contentType };
    }
    const out = await pipeline.jpeg({ quality: spec.q }).toBuffer();
    return { buffer: out, contentType };
  }
}
