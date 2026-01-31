import "reflect-metadata";
import multipart from "@fastify/multipart";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module.js";
import { HumanproofConfigService } from "./config/humanproof-config.service.js";
import { HumanproofHttpExceptionFilter } from "./shared/http-exception.filter.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );
  app.useGlobalFilters(new HumanproofHttpExceptionFilter());
  const fastify = app.getHttpAdapter().getInstance();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await fastify.register(multipart as any, {
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
    },
  });
  await app.enableCors({
    origin: process.env.CORS_ORIGIN ?? true,
    credentials: true,
  });
  app.setGlobalPrefix("api", { exclude: ["health"] });
  const config = app.get(HumanproofConfigService);
  const port = Number(config.port) || 4020;
  await app.listen(port, "0.0.0.0");
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
