import { Controller, Get, Param, Post, Body } from "@nestjs/common";
import { ModelRegistryService } from "./model-registry.service.js";
import { DeploymentService } from "./deployment.service.js";

@Controller()
export class RegistryController {
  constructor(
    private readonly registry: ModelRegistryService,
    private readonly deployment: DeploymentService
  ) {}

  @Get("health")
  health(): { status: string; service: string } {
    return { status: "ok", service: "@exibidos/ml-model-registry" };
  }

  @Get("registry/active")
  async getActive(): Promise<{ active: unknown }> {
    const active = await this.registry.getActive();
    return { active };
  }

  @Get("registry/models/:version")
  async getModel(@Param("version") version: string): Promise<{ model: unknown }> {
    const model = await this.registry.getModel(version);
    return { model: model ?? null };
  }

  @Get("registry/models/:version/metrics")
  async getMetrics(@Param("version") version: string): Promise<{ metrics: unknown }> {
    const metrics = await this.registry.getMetrics(version);
    return { metrics: metrics ?? null };
  }

  @Get("registry/versions")
  async listVersions(): Promise<{ versions: string[] }> {
    const versions = await this.registry.listVersions();
    return { versions };
  }

  @Post("admin/promote")
  async promote(
    @Body() body: { model_version: string; rollout_pct?: number }
  ): Promise<{ deployment: unknown }> {
    const deployment = await this.deployment.promote(
      body.model_version,
      body.rollout_pct ?? 100
    );
    return { deployment };
  }

  @Post("registry/admin/rollback")
  async rollback(): Promise<{ deployment: unknown }> {
    const deployment = await this.deployment.rollback();
    return { deployment: deployment ?? null };
  }
}
