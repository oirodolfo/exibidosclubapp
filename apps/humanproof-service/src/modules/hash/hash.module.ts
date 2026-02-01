import { Module } from "@nestjs/common";
import {
  ApprovedImageHashRepository,
  RejectedImageHashRepository,
} from "../../application/ports/image-hash.repository";
import { HumanproofConfigModule } from "../../config/config.module";
import {
  InMemoryApprovedImageHashRepository,
  InMemoryRejectedImageHashRepository,
} from "../../infra/persistence/in-memory-image-hash.repository";
import { HashService } from "./hash.service";

@Module({
  imports: [HumanproofConfigModule],
  providers: [
    HashService,
    {
      provide: ApprovedImageHashRepository,
      useClass: InMemoryApprovedImageHashRepository,
    },
    {
      provide: RejectedImageHashRepository,
      useClass: InMemoryRejectedImageHashRepository,
    },
  ],
  exports: [HashService],
})
export class HashModule {}
