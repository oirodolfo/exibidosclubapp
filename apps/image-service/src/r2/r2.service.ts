import { Injectable } from "@nestjs/common";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID ?? "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY ?? "";
const R2_BUCKET = process.env.R2_BUCKET ?? "";

@Injectable()
export class R2Service {
  private client: S3Client | null = null;
  private bucket = R2_BUCKET;

  private getClient(): S3Client {
    if (!this.client) {
      const endpoint =
        R2_ACCOUNT_ID &&
        R2_ACCESS_KEY_ID &&
        R2_SECRET_ACCESS_KEY
          ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
          : undefined;
      this.client = new S3Client({
        region: "auto",
        endpoint,
        credentials:
          R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY
            ? {
                accessKeyId: R2_ACCESS_KEY_ID,
                secretAccessKey: R2_SECRET_ACCESS_KEY,
              }
            : undefined,
      });
    }
    return this.client;
  }

  async download(key: string): Promise<Buffer> {
    const response = await this.getClient().send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key })
    );
    const body = response.Body;
    if (!body) throw new Error("Empty body");
    const chunks: Uint8Array[] = [];
    for await (const chunk of body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async upload(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.getClient().send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
  }

  processedKey(imageId: string, variant: string): string {
    return `processed/${imageId}/${variant}.webp`;
  }
}
