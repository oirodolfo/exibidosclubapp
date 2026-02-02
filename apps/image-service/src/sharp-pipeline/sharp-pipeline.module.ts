import { Module } from "@nestjs/common";
import { SharpPipelineService } from "./sharp-pipeline.service";

@Module({
  providers: [SharpPipelineService],
  exports: [SharpPipelineService],
})
export class SharpPipelineModule {}
