import { Module } from "@nestjs/common";
import { ImagesModule } from "../images/images.module";
import { ModerationModule } from "../moderation/moderation.module";
import { JobsController } from "./jobs.controller";
import { JobsProducerService } from "./jobs-producer.service";
import { ReprocessingService } from "./reprocessing.service";

@Module({
  imports: [ImagesModule, ModerationModule],
  controllers: [JobsController],
  providers: [JobsProducerService, ReprocessingService],
  exports: [JobsProducerService, ReprocessingService],
})
export class JobsModule {}
