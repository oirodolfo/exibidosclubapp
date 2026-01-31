import { Module } from "@nestjs/common";
import { ImageController } from "./image.controller.js";
import { ImageService } from "./image.service.js";
import { StorageService } from "./storage.service.js";
import { CacheModule } from "../cache/cache.module.js";
import { PolicyModule } from "../policy/policy.module.js";
import { TransformModule } from "../transform/transform.module.js";

@Module({
  imports: [CacheModule, PolicyModule, TransformModule],
  controllers: [ImageController],
  providers: [ImageService, StorageService],
  exports: [ImageService],
})
export class ImageModule {}
