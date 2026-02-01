import { Module } from "@nestjs/common";
import { ImageController } from "./image.controller";
import { ImageService } from "./image.service";
import { StorageService } from "./storage.service";
import { CacheModule } from "../cache/cache.module";
import { PolicyModule } from "../policy/policy.module";
import { TransformModule } from "../transform/transform.module";

@Module({
  imports: [CacheModule, PolicyModule, TransformModule],
  controllers: [ImageController],
  providers: [ImageService, StorageService],
  exports: [ImageService],
})
export class ImageModule {}
