import { Injectable } from "@nestjs/common";
import { getEnv } from "@exibidos/config";

/**
 * Injectable config service — environment-safe defaults.
 * No hardcoded config values; all from env or getEnv().
 */
@Injectable()
export class ConfigService {
  get env() {
    return getEnv();
  }

  get nodeEnv(): "development" | "production" | "test" {
    return this.env.nodeEnv;
  }

  get databaseUrl(): string {
    return this.env.databaseUrl;
  }

  get redisUrl(): string {
    return this.env.redisUrl;
  }

  get appUrl(): string {
    return this.env.appUrl;
  }

  get features() {
    return this.env.features;
  }

  get mlPipelineEnabled(): boolean {
    return this.env.features.mlPipeline;
  }

  get labelStudioBaseUrl(): string | null {
    return process.env.LABEL_STUDIO_BASE_URL ?? null;
  }

  get labelStudioApiToken(): string | null {
    return process.env.LABEL_STUDIO_API_TOKEN ?? null;
  }

  get labelStudioProjectId(): string | null {
    return process.env.LABEL_STUDIO_PROJECT_ID ?? null;
  }
}
