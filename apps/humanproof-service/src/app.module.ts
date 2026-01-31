import { Module } from "@nestjs/common";
import { HumanproofConfigModule } from "./config/config.module.js";
import { HashModule } from "./modules/hash/hash.module.js";
import { HealthModule } from "./modules/health/health.module.js";
import { MlModule } from "./modules/ml/ml.module.js";
import { VerificationModule } from "./modules/verification/verification.module.js";

@Module({
  imports: [
    HumanproofConfigModule,
    HealthModule,
    HashModule,
    MlModule,
    VerificationModule,
  ],
})
export class AppModule {}
