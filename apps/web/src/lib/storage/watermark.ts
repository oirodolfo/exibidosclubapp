/**
 * Mandatory "exibidos.club" watermark (Stage 8).
 * Applied server-side to ALL served images. No unwatermarked images ever served.
 */

import sharp from "sharp";

const WATERMARK_TEXT = "exibidos.club";
const PADDING = 12;
const FONT_SIZE = 16;
const SVG_WIDTH = 140;
const SVG_HEIGHT = 28;

function createWatermarkSvg(): Buffer {
  const svg = `
<svg width="${SVG_WIDTH}" height="${SVG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <text
    x="8"
    y="20"
    font-family="Arial, sans-serif"
    font-size="${FONT_SIZE}"
    font-weight="600"
    fill="rgba(255,255,255,0.9)"
    stroke="rgba(0,0,0,0.5)"
    stroke-width="2"
  >${WATERMARK_TEXT}</text>
</svg>
  `.trim();

  return Buffer.from(svg);
}

/**
 * Applies the exibidos.club watermark to an image buffer.
 * Placement: bottom-right corner with padding. Dynamic for different image sizes.
 */
export async function applyWatermark(
  input: Buffer,
  width: number,
  height: number,
  quality = 85
): Promise<Buffer> {
  const svg = createWatermarkSvg();
  const left = Math.max(0, width - SVG_WIDTH - PADDING);
  const top = Math.max(0, height - SVG_HEIGHT - PADDING);

  return sharp(input)
    .composite([{ input: svg, left, top }])
    .jpeg({ quality })
    .toBuffer();
}
