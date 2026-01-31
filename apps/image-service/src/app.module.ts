import { Module } from "@nestjs/common";
import { ImageModule } from "./image/image.module.js";

@Module({
  imports: [ImageModule],
})
export class AppModule {}
