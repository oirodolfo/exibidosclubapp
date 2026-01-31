/**
 * Hamming distance between two 64-bit hashes (hex strings, 16 chars).
 */
export function hammingDistance(a: string, b: string): number {
  if (a.length !== 16 || b.length !== 16) return 64;
  const x = BigInt("0x" + a);
  const y = BigInt("0x" + b);
  const xor = (x ^ y).toString(2);
  return (xor.match(/1/g) ?? []).length;
}

/**
 * dHash: 8x8 gradient hash as 64-bit hex string.
 * Uses sharp to resize to 9x8, then gradient bits.
 */
export async function dHashFromBuffer(buffer: Buffer): Promise<string> {
  const sharp = (await import("sharp")).default;
  const gray = await sharp(buffer)
    .resize(9, 8, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data, info } = gray;
  const w = info.width ?? 9;
  const h = info.height ?? 8;
  let bits = "";
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w - 1; x++) {
      const left = data[y * w + x] ?? 0;
      const right = data[y * w + x + 1] ?? 0;
      bits += left < right ? "1" : "0";
    }
  }
  const num = BigInt("0b" + bits);
  return num.toString(16).padStart(16, "0");
}
