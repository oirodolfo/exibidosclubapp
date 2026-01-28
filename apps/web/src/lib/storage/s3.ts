import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const env = process.env.NODE_ENV ?? "development";

function getBucket(): string {
  const b = process.env.S3_BUCKET;
  if (!b) throw new Error("S3_BUCKET is required for image storage");
  return b;
}

let _client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (_client) return _client;
  const endpoint = process.env.S3_ENDPOINT;
  const accessKey = process.env.S3_ACCESS_KEY;
  const secretKey = process.env.S3_SECRET_KEY;
  const region = process.env.S3_REGION ?? "us-east-1";
  const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";
  if (!accessKey || !secretKey) {
    throw new Error("S3_ACCESS_KEY and S3_SECRET_KEY are required for image storage");
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

export function buildStorageKey(
  userId: string,
  imageId: string,
  variant: "original" | "thumb" | "blur",
  ext: string
): string {
  return `${env}/${userId}/${imageId}/${variant}.${ext}`;
}

export type ProcessResult = {
  storageKey: string;
  thumbKey: string;
  blurKey: string;
  width?: number;
  height?: number;
};

export function extFromMime(mime: string): string {
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export async function uploadToS3(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<void> {
  const client = getS3Client();
  const bucket = getBucket();
  const input: PutObjectCommandInput = {
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  };
  await client.send(new PutObjectCommand(input));
}

export async function getSignedDownloadUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  const client = getS3Client();
  const bucket = getBucket();
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, cmd, { expiresIn: expiresInSeconds });
}

export function isS3Configured(): boolean {
  return !!(
    process.env.S3_BUCKET &&
    process.env.S3_ACCESS_KEY &&
    process.env.S3_SECRET_KEY
  );
}
