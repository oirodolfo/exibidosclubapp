import { Injectable } from "@nestjs/common";
import type { ModelDeployment } from "@exibidos/ml-contracts";
import { ModelRegistryService } from "./model-registry.service";

function rolloutPctToStage(pct: number): "pct_5" | "pct_25" | "pct_100" {
  if (pct >= 100) return "pct_100";
  if (pct >= 25) return "pct_25";
  return "pct_5";
}

@Injectable()
export class DeploymentService {
  constructor(private readonly registry: ModelRegistryService) {}

  async promote(newVersion: string, rolloutPct: number): Promise<ModelDeployment> {
    const current = await this.registry.getActive();
    const deployment: ModelDeployment = {
      model_version: newVersion,
      rollout_pct: rolloutPct,
      stage: rolloutPctToStage(rolloutPct),
      promotedAt: new Date().toISOString(),
      previous_version: current?.model_version ?? null,
    };
    await this.registry.setActive(deployment);
    return deployment;
  }

  async rollback(): Promise<ModelDeployment | null> {
    const current = await this.registry.getActive();
    if (!current?.previous_version) return null;
    const deployment: ModelDeployment = {
      model_version: current.previous_version,
      rollout_pct: 100,
      stage: "pct_100",
      promotedAt: new Date().toISOString(),
      previous_version: current.model_version,
    };
    await this.registry.setActive(deployment);
    return deployment;
  }
}
