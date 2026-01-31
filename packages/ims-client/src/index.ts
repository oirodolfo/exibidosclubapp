/**
 * @exibidos/ims-client — Strongly-typed image URL SDK.
 * This is the ONLY way to generate IMS image URLs (governance tool).
 * Use semantic builders and official presets; integrate with feature flags.
 */

export {
  imageUrl,
  ImageUrlBuilder,
  type ImageUrlBuilderOptions,
} from "./builder.js";
export { PRESETS } from "./presets.js";
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
} from "./types.js";
