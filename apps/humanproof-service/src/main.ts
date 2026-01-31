import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module.js";
import { HumanproofConfigService } from "./config/humanproof-config.service.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );
  const config = app.get(HumanproofConfigService);
  const port = Number(config.port) || 4020;
  await app.listen(port, "0.0.0.0");
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
