import { Injectable } from "@nestjs/common";
import type { ImageMlMetadataData } from "@exibidos/ml-contracts";
import sharp from "sharp";
import type { BlurMode } from "./contracts";

const FULL_BLUR_SIGMA = 12;
const REGION_BLUR_SIGMA = 8;

@Injectable()
export class BlurEngineService {
  async applyBlur(
    buffer: Buffer,
    width: number,
    height: number,
    mode: BlurMode,
    mlMetadata: ImageMlMetadataData | null
  ): Promise<Buffer> {
    if (mode === "none") return buffer;
    if (mode === "full") {
      return sharp(buffer).blur(FULL_BLUR_SIGMA).toBuffer();
    }
    if ((mode === "face" || mode === "eyes") && mlMetadata?.faceRegions?.length) {
      const composites: { input: Buffer; left: number; top: number }[] = [];
      for (const region of mlMetadata.faceRegions) {
        const left = Math.round(region.x * width);
        const top = Math.round(region.y * height);
        const w = Math.round(region.w * width);
        const h = Math.round(region.h * height);
        if (w <= 0 || h <= 0) continue;
        const regionBuffer = await sharp(buffer)
          .extract({ left, top, width: w, height: h })
          .blur(REGION_BLUR_SIGMA)
          .toBuffer();
        composites.push({ input: regionBuffer, left, top });
      }
      if (composites.length > 0) {
        return sharp(buffer).composite(composites).toBuffer();
      }
    }
    return buffer;
  }
}
