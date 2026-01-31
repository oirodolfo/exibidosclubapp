/**
 * Fetch original from S3 or local filesystem (fallback for local testing).
 * IMS never exposes original URLs; this is internal only.
 */

import { existsSync, readFileSync } from "fs";
import path from "path";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

function getBucket(): string {
  const b = process.env.S3_BUCKET;
  if (!b) throw new Error("S3_BUCKET is required for IMS");
  return b;
}

let _client: S3Client | null = null;

function getS3Client(): S3Client {
  if (_client) return _client;
  const endpoint = process.env.S3_ENDPOINT;
  const accessKey = process.env.S3_ACCESS_KEY;
  const secretKey = process.env.S3_SECRET_KEY;
  const region = process.env.S3_REGION ?? "us-east-1";
  const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";
  if (!accessKey || !secretKey) {
    throw new Error("S3_ACCESS_KEY and S3_SECRET_KEY are required for IMS");
  }
  _client = new S3Client({
    region,
    ...(endpoint && {
      endpoint,
      forcePathStyle: forcePathStyle || !!endpoint,
    }),
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });
  return _client;
}

function isS3Configured(): boolean {
  return !!(
    process.env.S3_BUCKET &&
    process.env.S3_ACCESS_KEY &&
    process.env.S3_SECRET_KEY
  );
}

function isLocalStorageEnabled(): boolean {
  if (process.env.STORAGE_PROVIDER === "local") return true;
  if (process.env.STORAGE_PROVIDER === "s3") return false;
  return !isS3Configured();
}

function getLocalBasePath(): string {
  const p = process.env.STORAGE_LOCAL_PATH;
  if (p) return path.resolve(process.cwd(), p);
  return path.join(process.cwd(), ".storage");
}

function contentTypeFromExt(ext: string): string {
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

async function fetchFromS3(key: string): Promise<{ buffer: Buffer; contentType: string }> {
  const client = getS3Client();
  const bucket = getBucket();
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await client.send(cmd);
  const body = response.Body;
  if (!body) {
    throw new Error("S3 GetObject returned no body");
  }
  const buffer = Buffer.from(await body.transformToByteArray());
  const contentType = (response.ContentType as string) ?? "image/jpeg";
  return { buffer, contentType };
}

function fetchFromLocal(key: string): { buffer: Buffer; contentType: string } {
  const basePath = getLocalBasePath();
  const fullPath = path.join(basePath, key);
  if (!existsSync(fullPath)) {
    throw new Error(`Local file not found: ${key}`);
  }
  const buffer = readFileSync(fullPath);
  const ext = path.extname(key).slice(1).toLowerCase() || "jpg";
  const contentType = contentTypeFromExt(ext);
  return { buffer, contentType };
}

/**
 * Fetch image by key from S3 or local storage (fallback when S3 not configured).
 */
export async function fetchFromStorage(key: string): Promise<{ buffer: Buffer; contentType: string }> {
  if (isS3Configured()) {
    return fetchFromS3(key);
  }
  if (isLocalStorageEnabled()) {
    return fetchFromLocal(key);
  }
  throw new Error("No storage configured (set S3_* or STORAGE_PROVIDER=local with STORAGE_LOCAL_PATH)");
}

export function isStorageConfigured(): boolean {
  return isS3Configured() || isLocalStorageEnabled();
}
