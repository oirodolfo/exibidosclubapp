/**
 * Client for ML Model Registry — used by upload pipeline to get active model version.
 * Upload pipeline consumes model via Model Registry; ML inference runs asynchronously.
 */

import type { ModelDeployment } from "@exibidos/ml-contracts";

export interface RegistryClientConfig {
  baseUrl: string;
}

/**
 * Fetch active deployment from NestJS Model Registry.
 * Upload pipeline uses this to determine which model version to use for async inference.
 */
export async function fetchActiveDeployment(
  config: RegistryClientConfig
): Promise<ModelDeployment | null> {
  const url = `${config.baseUrl.replace(/\/$/, "")}/registry/active`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const data = (await res.json()) as { active: ModelDeployment | null };
  return data.active ?? null;
}

/**
 * Get active model version string for inference.
 * Returns null if registry unavailable or no active deployment.
 */
export async function getActiveModelVersion(
  config: RegistryClientConfig
): Promise<string | null> {
  const active = await fetchActiveDeployment(config);
  return active?.model_version ?? null;
}
