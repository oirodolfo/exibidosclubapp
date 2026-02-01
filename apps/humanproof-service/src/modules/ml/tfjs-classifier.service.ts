import { Injectable, OnModuleInit } from "@nestjs/common";
import * as tf from "@tensorflow/tfjs";
import sharp from "sharp";
import {
  type MlClassifierOutput,
  MlClassifierPort,
} from "../../application/ports/ml-classifier.port";

const IMG_SIZE = 64;
const CHANNELS = 3;

@Injectable()
export class TfjsClassifierService extends MlClassifierPort implements OnModuleInit {
  private model: tf.LayersModel | null = null;

  async onModuleInit(): Promise<void> {
    this.model = await this.buildModel();
  }

  async classify(buffer: Buffer): Promise<MlClassifierOutput> {
    const pixels = await this.bufferToPixels(buffer);
    const input = tf.tensor4d(pixels, [1, IMG_SIZE, IMG_SIZE, CHANNELS]);
    const output = this.model!.predict(input) as tf.Tensor;
    const scores = await output.data();
    tf.dispose([input, output]);
    const handwrittenScore = Number(scores[0]) ?? 0;
    const photoScore = Number(scores[1]) ?? 0;
    const rawImageScore = Number(scores[2]) ?? 0;
    const explanation: string[] = [
      `handwritten vs printed: ${(handwrittenScore * 100).toFixed(1)}%`,
      `photo vs screen: ${(photoScore * 100).toFixed(1)}%`,
      `raw vs edited: ${(rawImageScore * 100).toFixed(1)}%`,
    ];
    return {
      handwrittenScore,
      photoScore,
      rawImageScore,
      explanation,
    };
  }

  private async buildModel(): Promise<tf.LayersModel> {
    const model = tf.sequential({
      layers: [
        tf.layers.flatten({ inputShape: [IMG_SIZE, IMG_SIZE, CHANNELS] }),
        tf.layers.dense({ units: 32, activation: "relu" }),
        tf.layers.dense({ units: 3, activation: "sigmoid" }),
      ],
    });
    model.compile({
      optimizer: "adam",
      loss: "binaryCrossentropy",
      metrics: ["accuracy"],
    });
    return model;
  }

  private async bufferToPixels(buffer: Buffer): Promise<Float32Array> {
    const { data, info } = await sharp(buffer)
      .resize(IMG_SIZE, IMG_SIZE, { fit: "fill" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const w = info.width ?? IMG_SIZE;
    const h = info.height ?? IMG_SIZE;
    const out = new Float32Array(1 * IMG_SIZE * IMG_SIZE * CHANNELS);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * (info.channels ?? 3);
        const r = (data[i] ?? 0) / 255;
        const g = (data[i + 1] ?? 0) / 255;
        const b = (data[i + 2] ?? 0) / 255;
        const o = (y * IMG_SIZE + x) * CHANNELS;
        out[o] = r;
        out[o + 1] = g;
        out[o + 2] = b;
      }
    }
    return out;
  }
}
