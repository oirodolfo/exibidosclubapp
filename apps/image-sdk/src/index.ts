/**
 * Image SDK — re-exports from ims-client for NestJS and other consumers.
 * Single source of truth for image URL building and transform contracts.
 */

export {
  imageUrl,
  ImageUrlBuilder,
  type ImageUrlBuilderOptions,
} from "@exibidos/ims-client";
export { PRESETS } from "@exibidos/ims-client";
export {
  IMS_CONTRACT_VERSION,
  type BlurContext,
  type BlurMode,
  type CropMode,
  type FitMode,
  type ImageUrlParams,
  type OutputFormat,
  type PresetName,
  type WatermarkKind,
} from "@exibidos/ims-client";
