import { Module } from "@nestjs/common";
import { QueueModule } from "@exibidos/queue";
import { R2Module } from "../r2/r2.module";
import { SharpPipelineModule } from "../sharp-pipeline/sharp-pipeline.module";
import { ImageWorkerService } from "./image-worker.service";

@Module({
  imports: [QueueModule.forRoot(), R2Module, SharpPipelineModule],
  providers: [ImageWorkerService],
})
export class ImageWorkerModule {}
