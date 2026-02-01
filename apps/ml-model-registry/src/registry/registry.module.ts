import { Module } from "@nestjs/common";
import { ModelRegistryService } from "./model-registry.service";
import { DeploymentService } from "./deployment.service";
import { GateEnforcementService } from "./gate-enforcement.service";
import { RegistryController } from "./registry.controller";

@Module({
  controllers: [RegistryController],
  providers: [ModelRegistryService, DeploymentService, GateEnforcementService],
  exports: [ModelRegistryService, DeploymentService, GateEnforcementService],
})
export class RegistryModule {}
