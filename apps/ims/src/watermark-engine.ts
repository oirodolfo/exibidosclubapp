/**
 * Watermark engine: global brand, user-specific, dynamic placement, saliency-aware.
 * Designed for premium customization, anti-cropping, legal attribution.
 */

import type { ImageMlMetadataData } from "@exibidos/ml";
import sharp from "sharp";
import type { WatermarkKind } from "./contracts";

export type { WatermarkKind };

export interface WatermarkOptions {
  kind: WatermarkKind;
  /** For user watermark: e.g. exibidos.club/@slug */
  userSlug?: string;
  /** Image dimensions after resize (for placement) */
  width: number;
  height: number;
  /** Saliency center 0–1; avoid covering when possible */
  saliency?: { centerX: number; centerY: number };
}

/** Brand text for global watermark. */
const BRAND_TEXT = "exibidos.club";

/** Watermark SVG and placement (tune for readability vs. intrusiveness). */
const WATERMARK_FONT_SIZE = 14;
const WATERMARK_PADDING_PX = 8;
const WATERMARK_FILL_OPACITY = 0.7;
const WATERMARK_STROKE_OPACITY = 0.3;
/** Approximate watermark overlay width/height for corner placement. */
const WATERMARK_OVERLAY_WIDTH_PX = 120;
const WATERMARK_OVERLAY_HEIGHT_PX = 24;
/** SVG canvas size for the text overlay. */
const WATERMARK_SVG_WIDTH = 200;
const WATERMARK_SVG_HEIGHT = 30;
const WATERMARK_TEXT_BASELINE_Y = 22;

/** Place in corner that minimizes overlap with saliency center (default: bottom-right). */
function placement(
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
  if (!saliency) {
    return corners[3]!;
  }
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

/** Build SVG text for watermark (escaped for XML). */
function svgText(text: string): string {
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `
<svg width="${WATERMARK_SVG_WIDTH}" height="${WATERMARK_SVG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <text x="0" y="${WATERMARK_TEXT_BASELINE_Y}" font-family="Arial,sans-serif" font-size="${WATERMARK_FONT_SIZE}" fill="white" fill-opacity="${WATERMARK_FILL_OPACITY}" stroke="black" stroke-opacity="${WATERMARK_STROKE_OPACITY}" stroke-width="1">${escaped}</text>
</svg>`;
}

/**
 * Apply watermark to buffer. Returns new buffer.
 */
export async function applyWatermark(
  buffer: Buffer,
  options: WatermarkOptions,
  mlMetadata: ImageMlMetadataData | null
): Promise<Buffer> {
  if (options.kind === "none") return buffer;

  const text =
    options.kind === "user" && options.userSlug
      ? `exibidos.club/@${options.userSlug}`
      : BRAND_TEXT;

  const svg = Buffer.from(svgText(text));
  const { left, top } = placement(options.width, options.height, mlMetadata?.saliency?.[0]
    ? {
        centerX: mlMetadata.saliency[0].centerX,
        centerY: mlMetadata.saliency[0].centerY,
      }
    : undefined);

  const overlay = await sharp(svg).png().toBuffer();
  return sharp(buffer)
    .composite([{ input: overlay, left, top }])
    .toBuffer();
}
