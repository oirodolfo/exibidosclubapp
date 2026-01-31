import { Module } from "@nestjs/common";
import { ModelRegistryService } from "./model-registry.service.js";
import { DeploymentService } from "./deployment.service.js";
import { GateEnforcementService } from "./gate-enforcement.service.js";
import { RegistryController } from "./registry.controller.js";

@Module({
  controllers: [RegistryController],
  providers: [ModelRegistryService, DeploymentService, GateEnforcementService],
  exports: [ModelRegistryService, DeploymentService, GateEnforcementService],
})
export class RegistryModule {}
