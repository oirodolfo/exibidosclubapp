import { Module } from "@nestjs/common";
import { ParserService } from "./parser.service.js";
import { CropStrategyService } from "./crop-strategy.service.js";
import { BlurEngineService } from "./blur-engine.service.js";
import { WatermarkEngineService } from "./watermark-engine.service.js";
import { TransformService } from "./transform.service.js";

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
