import { Module } from "@nestjs/common";
import { BlurPolicyService } from "./blur-policy.service.js";

@Module({
  providers: [BlurPolicyService],
  exports: [BlurPolicyService],
})
export class PolicyModule {}
