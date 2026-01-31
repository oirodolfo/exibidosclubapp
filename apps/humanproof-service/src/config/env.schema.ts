import Joi from "joi";

export const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().port().default(4020),

  // Verification code
  HUMANPROOF_VERIFICATION_CODE_TTL_SECONDS: Joi.number().integer().min(60).max(86400).default(600),
  HUMANPROOF_MAX_ATTEMPTS_PER_USER: Joi.number().integer().min(1).max(100).default(5),
  HUMANPROOF_MAX_ATTEMPTS_PER_DEVICE: Joi.number().integer().min(1).max(50).default(3),
  HUMANPROOF_MAX_DEVICES_PER_USER: Joi.number().integer().min(1).max(20).default(5),

  // ML & decision
  HUMANPROOF_ML_CONFIDENCE_THRESHOLD_VERIFIED: Joi.number().min(0).max(1).default(0.85),
  HUMANPROOF_ML_CONFIDENCE_THRESHOLD_REJECT: Joi.number().min(0).max(1).default(0.4),
  HUMANPROOF_ML_SHADOW_MODE: Joi.boolean().default(false),

  // Perceptual hash
  HUMANPROOF_HASH_SIMILARITY_THRESHOLD: Joi.number().integer().min(0).max(64).default(10),
})
  .unknown(true);

export type EnvSchema = {
  NODE_ENV: string;
  PORT: number;
  HUMANPROOF_VERIFICATION_CODE_TTL_SECONDS: number;
  HUMANPROOF_MAX_ATTEMPTS_PER_USER: number;
  HUMANPROOF_MAX_ATTEMPTS_PER_DEVICE: number;
  HUMANPROOF_MAX_DEVICES_PER_USER: number;
  HUMANPROOF_ML_CONFIDENCE_THRESHOLD_VERIFIED: number;
  HUMANPROOF_ML_CONFIDENCE_THRESHOLD_REJECT: number;
  HUMANPROOF_ML_SHADOW_MODE: boolean;
  HUMANPROOF_HASH_SIMILARITY_THRESHOLD: number;
};
