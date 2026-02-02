import { Module } from "@nestjs/common";
import { R2Module } from "../r2/r2.module";
import { SharpPipelineModule } from "../sharp-pipeline/sharp-pipeline.module";
import { ImageWorkerService } from "./image-worker.service";

@Module({
  imports: [R2Module, SharpPipelineModule],
  providers: [ImageWorkerService],
})
export class ImageWorkerModule {}
