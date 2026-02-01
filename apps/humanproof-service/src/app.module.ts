import { Module } from "@nestjs/common";
import { HumanproofConfigModule } from "./config/config.module";
import { DecisionModule } from "./modules/decision/decision.module";
import { EventsModule } from "./modules/events/events.module";
import { HashModule } from "./modules/hash/hash.module";
import { HealthModule } from "./modules/health/health.module";
import { MlModule } from "./modules/ml/ml.module";
import { VerificationModule } from "./modules/verification/verification.module";

@Module({
  imports: [
    HumanproofConfigModule,
    EventsModule,
    HealthModule,
    HashModule,
    MlModule,
    DecisionModule,
    VerificationModule,
  ],
})
export class AppModule {}
