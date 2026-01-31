import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { EnvSchema } from "./env.schema.js";

@Injectable()
export class HumanproofConfigService {
  constructor(private readonly config: ConfigService<EnvSchema, true>) {}

  get nodeEnv(): string {
    return this.config.get("NODE_ENV", { infer: true }) ?? "development";
  }

  get port(): number {
    return this.config.get("PORT", { infer: true }) ?? 4020;
  }

  get verificationCodeTtlSeconds(): number {
    return this.config.get("HUMANPROOF_VERIFICATION_CODE_TTL_SECONDS", { infer: true }) ?? 600;
  }

  get maxAttemptsPerUser(): number {
    return this.config.get("HUMANPROOF_MAX_ATTEMPTS_PER_USER", { infer: true }) ?? 5;
  }

  get maxAttemptsPerDevice(): number {
    return this.config.get("HUMANPROOF_MAX_ATTEMPTS_PER_DEVICE", { infer: true }) ?? 3;
  }

  get maxDevicesPerUser(): number {
    return this.config.get("HUMANPROOF_MAX_DEVICES_PER_USER", { infer: true }) ?? 5;
  }

  get mlConfidenceThresholdVerified(): number {
    return this.config.get("HUMANPROOF_ML_CONFIDENCE_THRESHOLD_VERIFIED", { infer: true }) ?? 0.85;
  }

  get mlConfidenceThresholdReject(): number {
    return this.config.get("HUMANPROOF_ML_CONFIDENCE_THRESHOLD_REJECT", { infer: true }) ?? 0.4;
  }

  get mlShadowMode(): boolean {
    return this.config.get("HUMANPROOF_ML_SHADOW_MODE", { infer: true }) ?? false;
  }

  get hashSimilarityThreshold(): number {
    return this.config.get("HUMANPROOF_HASH_SIMILARITY_THRESHOLD", { infer: true }) ?? 10;
  }
}
