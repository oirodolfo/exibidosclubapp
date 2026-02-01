import { Module } from "@nestjs/common";
import { ImsController } from "./ims.controller";
import { ImsImageService } from "./ims-image.service";

@Module({
  controllers: [ImsController],
  providers: [ImsImageService],
})
export class ImsModule {}
