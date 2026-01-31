import type { EnvSchema } from "./env.schema.js";

export function configuration(): EnvSchema {
  return {
    NODE_ENV: process.env.NODE_ENV ?? "development",
    PORT: coercePort(process.env.PORT, 4020),
    HUMANPROOF_VERIFICATION_CODE_TTL_SECONDS: coerceInt(
      process.env.HUMANPROOF_VERIFICATION_CODE_TTL_SECONDS,
      600,
      60,
      86400
    ),
    HUMANPROOF_MAX_ATTEMPTS_PER_USER: coerceInt(
      process.env.HUMANPROOF_MAX_ATTEMPTS_PER_USER,
      5,
      1,
      100
    ),
    HUMANPROOF_MAX_ATTEMPTS_PER_DEVICE: coerceInt(
      process.env.HUMANPROOF_MAX_ATTEMPTS_PER_DEVICE,
      3,
      1,
      50
    ),
    HUMANPROOF_MAX_DEVICES_PER_USER: coerceInt(
      process.env.HUMANPROOF_MAX_DEVICES_PER_USER,
      5,
      1,
      20
    ),
    HUMANPROOF_ML_CONFIDENCE_THRESHOLD_VERIFIED: coerceFloat(
      process.env.HUMANPROOF_ML_CONFIDENCE_THRESHOLD_VERIFIED,
      0.85,
      0,
      1
    ),
    HUMANPROOF_ML_CONFIDENCE_THRESHOLD_REJECT: coerceFloat(
      process.env.HUMANPROOF_ML_CONFIDENCE_THRESHOLD_REJECT,
      0.4,
      0,
      1
    ),
    HUMANPROOF_ML_SHADOW_MODE: process.env.HUMANPROOF_ML_SHADOW_MODE === "true",
    HUMANPROOF_HASH_SIMILARITY_THRESHOLD: coerceInt(
      process.env.HUMANPROOF_HASH_SIMILARITY_THRESHOLD,
      10,
      0,
      64
    ),
  };
}

function coercePort(value: string | undefined, defaultVal: number): number {
  const n = parseInt(value ?? "", 10);
  return Number.isNaN(n) ? defaultVal : Math.max(0, Math.min(65535, n)) || defaultVal;
}

function coerceInt(
  value: string | undefined,
  defaultVal: number,
  min: number,
  max: number
): number {
  const n = parseInt(value ?? "", 10);
  if (Number.isNaN(n)) return defaultVal;
  return Math.max(min, Math.min(max, n));
}

function coerceFloat(
  value: string | undefined,
  defaultVal: number,
  min: number,
  max: number
): number {
  const n = parseFloat(value ?? "");
  if (Number.isNaN(n)) return defaultVal;
  return Math.max(min, Math.min(max, n));
}
