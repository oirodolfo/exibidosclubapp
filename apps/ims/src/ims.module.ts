import { Module } from "@nestjs/common";
import { ImsController } from "./ims.controller.js";
import { ImsImageService } from "./ims-image.service.js";

@Module({
  controllers: [ImsController],
  providers: [ImsImageService],
})
export class ImsModule {}
