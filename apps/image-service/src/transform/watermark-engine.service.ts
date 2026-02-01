import { Injectable } from "@nestjs/common";
import type { ImageMlMetadataData } from "@exibidos/ml-contracts";
import sharp from "sharp";
import type { WatermarkKind } from "./contracts";

export interface WatermarkOptions {
  kind: WatermarkKind;
  userSlug?: string;
  width: number;
  height: number;
  saliency?: { centerX: number; centerY: number };
}

const BRAND_TEXT = "exibidos.club";
const WATERMARK_FONT_SIZE = 14;
const WATERMARK_PADDING_PX = 8;
const WATERMARK_FILL_OPACITY = 0.7;
const WATERMARK_STROKE_OPACITY = 0.3;
const WATERMARK_OVERLAY_WIDTH_PX = 120;
const WATERMARK_OVERLAY_HEIGHT_PX = 24;
const WATERMARK_SVG_WIDTH = 200;
const WATERMARK_SVG_HEIGHT = 30;
const WATERMARK_TEXT_BASELINE_Y = 22;

@Injectable()
export class WatermarkEngineService {
  async applyWatermark(
    buffer: Buffer,
    options: WatermarkOptions,
    mlMetadata: ImageMlMetadataData | null
  ): Promise<Buffer> {
    if (options.kind === "none") return buffer;

    const text =
      options.kind === "user" && options.userSlug
        ? `exibidos.club/@${options.userSlug}`
        : BRAND_TEXT;

    const svg = Buffer.from(this.svgText(text));
    const saliency = mlMetadata?.saliency?.[0]
      ? { centerX: mlMetadata.saliency[0].centerX, centerY: mlMetadata.saliency[0].centerY }
      : undefined;
    const { left, top } = this.placement(options.width, options.height, saliency);

    const overlay = await sharp(svg).png().toBuffer();
    return sharp(buffer)
      .composite([{ input: overlay, left, top }])
      .toBuffer();
  }

  private placement(
    width: number,
    height: number,
    saliency?: { centerX: number; centerY: number }
  ): { left: number; top: number } {
    const pad = WATERMARK_PADDING_PX;
    const corners = [
      { left: pad, top: pad },
      { left: width - WATERMARK_OVERLAY_WIDTH_PX - pad, top: pad },
      { left: pad, top: height - WATERMARK_OVERLAY_HEIGHT_PX - pad },
      { left: width - WATERMARK_OVERLAY_WIDTH_PX - pad, top: height - WATERMARK_OVERLAY_HEIGHT_PX - pad },
    ];
    if (!saliency) return corners[3]!;
    const cx = saliency.centerX * width;
    const cy = saliency.centerY * height;
    let best = corners[0]!;
    let bestDist = 0;
    for (const c of corners) {
      const dist = (c.left - cx) ** 2 + (c.top - cy) ** 2;
      if (dist > bestDist) {
        bestDist = dist;
        best = c;
      }
    }
    return best;
  }

  private svgText(text: string): string {
    const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `
<svg width="${WATERMARK_SVG_WIDTH}" height="${WATERMARK_SVG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <text x="0" y="${WATERMARK_TEXT_BASELINE_Y}" font-family="Arial,sans-serif" font-size="${WATERMARK_FONT_SIZE}" fill="white" fill-opacity="${WATERMARK_FILL_OPACITY}" stroke="black" stroke-opacity="${WATERMARK_STROKE_OPACITY}" stroke-width="1">${escaped}</text>
</svg>`;
  }
}
