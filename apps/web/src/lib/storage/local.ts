/**
 * Local filesystem storage for testing without S3/MinIO.
 * Keys use same layout as S3: {env}/{userId}/{imageId}/{variant}.{ext}.
 * Set STORAGE_PROVIDER=local or omit S3_* in development to use this.
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { log } from "@/lib/logger";

function getBasePath(): string {
  const p = process.env.STORAGE_LOCAL_PATH;
  if (p) return path.resolve(process.cwd(), p);
  return path.join(process.cwd(), ".storage");
}

function getFilePath(key: string): string {
  return path.join(getBasePath(), key);
}

/** Infer Content-Type from file extension (for readFromLocal). */
function contentTypeFromExt(ext: string): string {
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

/** Base directory for local storage (for debugging or IMS STORAGE_LOCAL_PATH). */
export function getLocalStoragePath(): string {
  return getBasePath();
}

/** Write file to local path; creates parent directories if needed. */
export async function uploadToLocal(
  key: string,
  body: Buffer | Uint8Array,
  _contentType: string
): Promise<void> {
  const fullPath = getFilePath(key);
  const dir = path.dirname(fullPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  log.storage.debug("uploadToLocal", { key, size: body.byteLength });
  writeFileSync(fullPath, Buffer.from(body));
}

/** Read file from local path; throws if not found. Content-Type inferred from extension. */
export function readFromLocal(key: string): { buffer: Buffer; contentType: string } {
  const fullPath = getFilePath(key);
  if (!existsSync(fullPath)) {
    throw new Error(`Local file not found: ${key}`);
  }
  const buffer = readFileSync(fullPath);
  const ext = path.extname(key).slice(1).toLowerCase() || "jpg";
  const contentType = contentTypeFromExt(ext);
  return { buffer, contentType };
}

/** URL for the client to fetch the image (points to /api/images/serve?key=...). */
export function getLocalDownloadUrl(key: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const baseUrl = base.replace(/\/$/, "");
  return `${baseUrl}/api/images/serve?key=${encodeURIComponent(key)}`;
}

export function isLocalStorageEnabled(): boolean {
  if (process.env.STORAGE_PROVIDER === "local") return true;
  if (process.env.STORAGE_PROVIDER === "s3") return false;
  const s3Set = !!(
    process.env.S3_BUCKET &&
    process.env.S3_ACCESS_KEY &&
    process.env.S3_SECRET_KEY
  );
  return process.env.NODE_ENV === "development" && !s3Set;
}
