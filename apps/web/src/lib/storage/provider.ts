/**
 * Unified storage: S3 or local filesystem (fallback for local testing).
 * Use upload() and getSignedDownloadUrl() so callers don't depend on provider.
 * When S3 is configured we try S3 first; on failure we fall back to local if enabled.
 */

import {
  getSignedDownloadUrl as getS3SignedUrl,
  isS3Configured,
  uploadToS3,
} from "./s3";
import {
  getLocalDownloadUrl,
  isLocalStorageEnabled,
  uploadToLocal,
} from "./local";
import { log } from "@/lib/logger";

/** True when S3 is configured or local fallback is enabled (e.g. development without S3). */
export function isStorageConfigured(): boolean {
  return isS3Configured() || isLocalStorageEnabled();
}

/** Current provider: S3 or local. Prefers S3 when configured; otherwise local when enabled. */
export function getStorageProvider(): "s3" | "local" {
  if (isS3Configured()) return "s3";

  if (isLocalStorageEnabled()) return "local";

  return "s3";
}

/** Upload by key; uses S3 or local. Tries S3 first when configured; on failure falls back to local if enabled. */
export async function upload(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<void> {
  if (getStorageProvider() === "s3") {
    try {
      return await uploadToS3(key, body, contentType);
    } catch (err) {
      if (isLocalStorageEnabled()) {
        log.storage.warn("upload: S3 failed, falling back to local", { key, error: err });

        return uploadToLocal(key, body, contentType);
      }

      throw err;
    }
  }

  return uploadToLocal(key, body, contentType);
}

/** Signed or local URL for download; expiresInSeconds only applies to S3. */
export async function getSignedDownloadUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  if (getStorageProvider() === "s3") {
    return getS3SignedUrl(key, expiresInSeconds);
  }

  return getLocalDownloadUrl(key);
}
