/**
 * Face detection for blur suggestion and region blur (Stage 7).
 * Uses @vladmandic/face-api with TF.js WASM backend.
 * When FEATURE_FACE_BLUR is false or detection fails, returns empty (no faces).
 */

import sharp from "sharp";
import * as tf from "@tensorflow/tfjs";
import * as wasm from "@tensorflow/tfjs-backend-wasm";

export type FaceBox = { x: number; y: number; width: number; height: number };
export type EyeRegion = { x: number; y: number; width: number; height: number };
export type FaceResult = { box: FaceBox; eyes?: EyeRegion[] };

let initialized = false;

async function ensureInitialized(): Promise<boolean> {
  if (initialized) return true;
  if (process.env.FEATURE_FACE_BLUR !== "true") return false;
  try {
    wasm.setWasmPaths(
      "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@4.22.0/dist/",
      true
    );
    await tf.setBackend("wasm");
    await tf.ready();
    initialized = true;
    return true;
  } catch {
    return false;
  }
}

function bufferToTensor(buffer: Buffer, width: number, height: number): tf.Tensor3D {
  const arr = new Int32Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) arr[i] = buffer[i];
  const rgb = new Int32Array(height * width * 3);
  for (let i = 0; i < height * width; i++) {
    rgb[i * 3] = arr[i * 4];
    rgb[i * 3 + 1] = arr[i * 4 + 1];
    rgb[i * 3 + 2] = arr[i * 4 + 2];
  }
  return tf.tensor3d(rgb, [height, width, 3], "int32");
}

export async function detectFaces(buffer: Buffer): Promise<FaceResult[]> {
  const ready = await ensureInitialized();
  if (!ready) return [];

  let faceapi: typeof import("@vladmandic/face-api");
  try {
    faceapi = await import("@vladmandic/face-api/dist/face-api.node-wasm.js");
  } catch {
    return [];
  }

  try {
    const pathMod = await import("path");
    const pkgPath = require.resolve("@vladmandic/face-api/package.json");
    const modelPath = pathMod.join(pathMod.dirname(pkgPath), "model");
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
  } catch {
    return [];
  }

  let tensor: tf.Tensor3D | null = null;
  try {
    const { data, info } = await sharp(buffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    tensor = bufferToTensor(data, info.width, info.height);
    const expandT = tf.expandDims(tensor, 0) as tf.Tensor4D;
    const options = new faceapi.SsdMobilenetv1Options({
      minConfidence: 0.3,
      maxResults: 10,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await faceapi.detectAllFaces(expandT as any, options).withFaceLandmarks();
    tf.dispose([tensor, expandT]);

    return result.map((r) => {
      const box = r.detection.box;
      const boxOut: FaceBox = {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
      };
      let eyes: EyeRegion[] | undefined;
      if (r.landmarks) {
        const pts = r.landmarks.positions;
        const leftEye = pts.slice(36, 42);
        const rightEye = pts.slice(42, 48);
        const toRegion = (eye: typeof leftEye) => {
          const xs = eye.map((p) => p.x);
          const ys = eye.map((p) => p.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          const pad = 8;
          return {
            x: Math.max(0, Math.round(minX) - pad),
            y: Math.max(0, Math.round(minY) - pad),
            width: Math.round(maxX - minX) + pad * 2,
            height: Math.round(maxY - minY) + pad * 2,
          };
        };
        eyes = [toRegion(leftEye), toRegion(rightEye)];
      }
      return { box: boxOut, eyes };
    });
  } catch {
    if (tensor) tf.dispose(tensor);
    return [];
  }
}
