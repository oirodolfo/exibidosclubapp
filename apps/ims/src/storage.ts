/**
 * Fetch original from S3. IMS never exposes original URLs; this is internal only.
 */

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

export async function fetchFromS3(key: string): Promise<{ buffer: Buffer; contentType: string }> {
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

export function isStorageConfigured(): boolean {
  return !!(
    process.env.S3_BUCKET &&
    process.env.S3_ACCESS_KEY &&
    process.env.S3_SECRET_KEY
  );
}
