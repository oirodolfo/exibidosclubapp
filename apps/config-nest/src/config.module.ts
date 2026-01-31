import { Global, Module } from "@nestjs/common";
import { ConfigService } from "./config.service.js";
import { FeatureFlagService } from "./feature-flag.service.js";

@Global()
@Module({
  providers: [ConfigService, FeatureFlagService],
  exports: [ConfigService, FeatureFlagService],
})
export class ConfigModule {}

export { ConfigService } from "./config.service.js";
