import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";
import { StorageService } from "./image/storage.service";
import { CacheService } from "./cache/cache.service";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );
  const storage = app.get(StorageService);
  storage.configure({
    s3Bucket: process.env.S3_BUCKET,
    s3AccessKey: process.env.S3_ACCESS_KEY,
    s3SecretKey: process.env.S3_SECRET_KEY,
    s3Region: process.env.S3_REGION ?? "us-east-1",
    s3Endpoint: process.env.S3_ENDPOINT,
    s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    storageProvider: process.env.STORAGE_PROVIDER as "s3" | "local" | undefined,
    storageLocalPath: process.env.STORAGE_LOCAL_PATH,
  });
  const cache = app.get(CacheService);
  const maxSize = process.env.IMS_MEMORY_CACHE_MAX
    ? parseInt(process.env.IMS_MEMORY_CACHE_MAX, 10)
    : 0;
  const ttl = process.env.IMS_MEMORY_CACHE_TTL
    ? parseInt(process.env.IMS_MEMORY_CACHE_TTL, 10)
    : 3600;
  cache.configure({ maxSize: Number.isNaN(maxSize) ? 0 : maxSize, ttlSeconds: Number.isNaN(ttl) ? 3600 : ttl });

  await app.enableCors({ origin: true });
  const port = Number(process.env.PORT) || 4001;
  await app.listen(port, "0.0.0.0");
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
