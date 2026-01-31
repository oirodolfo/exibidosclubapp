import { Injectable } from "@nestjs/common";
import type {
  ModelDeployment,
  ModelVersionDescriptor,
  GateDecisionArtifact,
  TrainingMetricsArtifact,
} from "@exibidos/ml-contracts";

@Injectable()
export class ModelRegistryService {
  private readonly models = new Map<string, ModelVersionDescriptor>();
  private readonly metrics = new Map<string, TrainingMetricsArtifact>();
  private readonly gateDecisions = new Map<string, GateDecisionArtifact>();
  private active: ModelDeployment | null = null;

  async register(
    descriptor: ModelVersionDescriptor,
    metrics: TrainingMetricsArtifact,
    gateDecision?: GateDecisionArtifact
  ): Promise<void> {
    this.models.set(descriptor.model_version, descriptor);
    this.metrics.set(descriptor.model_version, metrics);
    if (gateDecision) {
      this.gateDecisions.set(descriptor.model_version, gateDecision);
    }
  }

  async getActive(): Promise<ModelDeployment | null> {
    return this.active;
  }

  async getModel(version: string): Promise<ModelVersionDescriptor | null> {
    return this.models.get(version) ?? null;
  }

  async getMetrics(version: string): Promise<TrainingMetricsArtifact | null> {
    return this.metrics.get(version) ?? null;
  }

  async listVersions(): Promise<string[]> {
    return Array.from(this.models.keys()).sort().reverse();
  }

  async setActive(deployment: ModelDeployment): Promise<void> {
    this.active = deployment;
  }
}
