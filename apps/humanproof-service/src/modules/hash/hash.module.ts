import { Module } from "@nestjs/common";
import {
  ApprovedImageHashRepository,
  RejectedImageHashRepository,
} from "../../application/ports/image-hash.repository.js";
import {
  InMemoryApprovedImageHashRepository,
  InMemoryRejectedImageHashRepository,
} from "../../infra/persistence/in-memory-image-hash.repository.js";
import { HashService } from "./hash.service.js";

@Module({
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
