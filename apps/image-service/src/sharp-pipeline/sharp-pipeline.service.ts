import { Injectable } from "@nestjs/common";
import sharp, { type Sharp } from "sharp";
import type { ImageAction } from "@exibidos/image-contracts";

@Injectable()
export class SharpPipelineService {
  async execute(buffer: Buffer, actions: ImageAction[]): Promise<Buffer> {
    let pipeline: Sharp = sharp(buffer);
    for (const action of actions) {
      switch (action.kind) {
        case "resize":
          pipeline = pipeline.resize(action.width, undefined, {
            withoutEnlargement: true,
          });
          break;
        case "thumb":
          pipeline = pipeline.resize(action.width, undefined, {
            withoutEnlargement: true,
          });
          break;
        case "blur":
          pipeline = pipeline.blur(action.radius);
          break;
        case "convert":
          pipeline =
            action.format === "webp"
              ? pipeline.webp({ quality: 85 })
              : pipeline.avif({ quality: 80 });
          break;
        default:
          break;
      }
    }
    return pipeline.toBuffer();
  }
}
