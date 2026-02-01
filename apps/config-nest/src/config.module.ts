import { Global, Module } from "@nestjs/common";
import { ConfigService } from "./config.service";
import { FeatureFlagService } from "./feature-flag.service";

@Global()
@Module({
  providers: [ConfigService, FeatureFlagService],
  exports: [ConfigService, FeatureFlagService],
})
export class ConfigModule {}

export { ConfigService } from "./config.service";
