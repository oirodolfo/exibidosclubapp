import { Injectable } from "@nestjs/common";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

@Injectable()
export class StorageService {
  private client: S3Client | null = null;
  private bucket = "";
  private useS3 = false;
  private useLocal = false;
  private localBasePath = "";

  configure(options: {
    s3Bucket?: string;
    s3AccessKey?: string;
    s3SecretKey?: string;
    s3Region?: string;
    s3Endpoint?: string;
    s3ForcePathStyle?: boolean;
    storageProvider?: "s3" | "local";
    storageLocalPath?: string;
  }): void {
    const s3Configured = !!(
      options.s3Bucket &&
      options.s3AccessKey &&
      options.s3SecretKey
    );
    this.useS3 = options.storageProvider === "s3" || (options.storageProvider !== "local" && s3Configured);
    this.useLocal = options.storageProvider === "local" || (options.storageProvider !== "s3" && !s3Configured);
    this.bucket = options.s3Bucket ?? "";
    this.localBasePath = options.storageLocalPath
      ? path.resolve(process.cwd(), options.storageLocalPath)
      : path.join(process.cwd(), ".storage");

    if (this.useS3 && options.s3AccessKey && options.s3SecretKey) {
      this.client = new S3Client({
        region: options.s3Region ?? "us-east-1",
        ...(options.s3Endpoint && {
          endpoint: options.s3Endpoint,
          forcePathStyle: options.s3ForcePathStyle ?? !!options.s3Endpoint,
        }),
        credentials: {
          accessKeyId: options.s3AccessKey,
          secretAccessKey: options.s3SecretKey,
        },
      });
    }
  }

  isConfigured(): boolean {
    return this.useS3 || this.useLocal;
  }

  async fetch(key: string): Promise<{ buffer: Buffer; contentType: string }> {
    if (this.useS3 && this.client && this.bucket) {
      return this.fetchFromS3(key);
    }
    if (this.useLocal) {
      return this.fetchFromLocal(key);
    }
    throw new Error("No storage configured");
  }

  private async fetchFromS3(key: string): Promise<{ buffer: Buffer; contentType: string }> {
    if (!this.client || !this.bucket) throw new Error("S3 not configured");
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    const response = await this.client.send(cmd);
    const body = response.Body;
    if (!body) throw new Error("S3 GetObject returned no body");
    const buffer = Buffer.from(await body.transformToByteArray());
    const contentType = (response.ContentType as string) ?? "image/jpeg";
    return { buffer, contentType };
  }

  private fetchFromLocal(key: string): { buffer: Buffer; contentType: string } {
    const fullPath = path.join(this.localBasePath, key);
    if (!existsSync(fullPath)) throw new Error(`Local file not found: ${key}`);
    const buffer = readFileSync(fullPath);
    const ext = path.extname(key).slice(1).toLowerCase() || "jpg";
    const contentType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    return { buffer, contentType };
  }
}
