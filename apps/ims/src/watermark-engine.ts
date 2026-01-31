/**
 * Watermark engine: global brand, user-specific, dynamic placement, saliency-aware.
 * Designed for premium customization, anti-cropping, legal attribution.
 */

import type { ImageMlMetadataData } from "@exibidos/ml";
import sharp from "sharp";
import type { WatermarkKind } from "./contracts.js";

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

const BRAND_TEXT = "exibidos.club";
const FONT_SIZE = 14;
const PADDING = 8;
const OPACITY = 0.7;

/** Place in corner that minimizes overlap with saliency center. */
function placement(
  width: number,
  height: number,
  saliency?: { centerX: number; centerY: number }
): { left: number; top: number } {
  const pad = PADDING;
  const corners = [
    { left: pad, top: pad },
    { left: width - 120 - pad, top: pad },
    { left: pad, top: height - 24 - pad },
    { left: width - 120 - pad, top: height - 24 - pad },
  ];
  if (!saliency) {
    return corners[3]!; // default bottom-right
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

/** Build SVG text for watermark. */
function svgText(text: string): string {
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `
<svg width="200" height="30" xmlns="http://www.w3.org/2000/svg">
  <text x="0" y="22" font-family="Arial,sans-serif" font-size="${FONT_SIZE}" fill="white" fill-opacity="${OPACITY}" stroke="black" stroke-opacity="0.3" stroke-width="1">${escaped}</text>
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
