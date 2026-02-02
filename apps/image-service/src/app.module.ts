import { Module } from "@nestjs/common";
import { ImageModule } from "./image/image.module";
import { ImageWorkerModule } from "./worker/image-worker.module";

@Module({
  imports: [ImageModule, ImageWorkerModule],
})
export class AppModule {}
