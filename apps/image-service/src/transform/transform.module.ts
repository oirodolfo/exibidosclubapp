import { Module } from "@nestjs/common";
import { ParserService } from "./parser.service";
import { CropStrategyService } from "./crop-strategy.service";
import { BlurEngineService } from "./blur-engine.service";
import { WatermarkEngineService } from "./watermark-engine.service";
import { TransformService } from "./transform.service";

@Module({
  providers: [
    ParserService,
    CropStrategyService,
    BlurEngineService,
    WatermarkEngineService,
    TransformService,
  ],
  exports: [ParserService, TransformService],
})
export class TransformModule {}
