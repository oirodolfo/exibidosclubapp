import { Module, Global } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import { envSchema } from "./env.schema";
import { configuration } from "./configuration";
import { HumanproofConfigService } from "./humanproof-config.service";

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
      load: [configuration],
      validate: (config: unknown) => {
        const result = envSchema.validate(config, {
          abortEarly: false,
          stripUnknown: true,
        });
        if (result.error) {
          throw result.error;
        }
        return result.value as ReturnType<typeof configuration>;
      },
    }),
  ],
  providers: [HumanproofConfigService],
  exports: [HumanproofConfigService],
})
export class HumanproofConfigModule {}
