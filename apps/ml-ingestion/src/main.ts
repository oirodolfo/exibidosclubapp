import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app.module.js";
import { IngestionSchedulerService } from "./ingestion/ingestion-scheduler.service.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );
  await app.enableCors({ origin: true });

  const baseUrl = process.env.LABEL_STUDIO_BASE_URL;
  const apiToken = process.env.LABEL_STUDIO_API_TOKEN;
  const projectId = process.env.LABEL_STUDIO_PROJECT_ID;
  if (baseUrl && apiToken && projectId) {
    const scheduler = app.get(IngestionSchedulerService);
    scheduler.setConfig({ baseUrl, apiToken, projectId });
  }

  const port = Number(process.env.PORT) || 4010;
  await app.listen(port, "0.0.0.0");
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
