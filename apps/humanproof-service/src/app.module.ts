import { Module } from "@nestjs/common";
import { HumanproofConfigModule } from "./config/config.module.js";
import { HealthModule } from "./modules/health/health.module.js";

@Module({
  imports: [HumanproofConfigModule, HealthModule],
})
export class AppModule {}
