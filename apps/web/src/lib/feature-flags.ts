/**
 * Feature flag resolution: env overrides DB.
 * Env (e.g. FEATURE_TAGGING=true) takes precedence. DB supports rollout % and user overrides.
 */

import { prisma } from "@exibidos/db/client";

function toEnvKey(key: string): string {
  const k = key.replace(/^FEATURE_/, "").toUpperCase().replace(/-/g, "_");
  return `FEATURE_${k}`;
}

export async function isFeatureEnabled(
  key: string,
  userId?: string | null
): Promise<boolean> {
  const envKey = toEnvKey(key);
  const envVal = process.env[envKey];
  if (envVal !== undefined) return envVal === "true";

  const dbKey = key.replace(/^FEATURE_/, "").toLowerCase();
  try {
    const flag = await prisma.featureFlag.findUnique({ where: { key: dbKey } });
    if (!flag) return false;
    if (userId) {
      const override = await prisma.featureFlagOverride.findUnique({
        where: { flagId_userId: { flagId: flag.id, userId } },
      });
      if (override) return override.enabled;
    }
    if (flag.rolloutPct >= 100) return flag.enabled;
    if (flag.rolloutPct <= 0) return false;
    if (userId) {
      const hash = userId.split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0);
      return flag.enabled && Math.abs(hash % 100) < flag.rolloutPct;
    }
    return flag.enabled;
  } catch {
    return false;
  }
}

export function isFeatureEnabledSync(key: string): boolean {
  return process.env[toEnvKey(key)] === "true";
}
