/**
 * Official presets: feed, swipe, ranking, profile, OG cards.
 * Enforce safety (context=public) and watermark where required.
 */

import type { ImageUrlParams, PresetName } from "./types";
import { IMS_CONTRACT_VERSION } from "./types";

const V = IMS_CONTRACT_VERSION;

/** Preset definitions: semantic, product-aligned. */
export const PRESETS: Record<PresetName, ImageUrlParams> = {
  feed: {
    v: V,
    w: 800,
    fit: "inside",
    fmt: "webp",
    q: 85,
    context: "public",
    watermark: "brand",
  },
  swipe: {
    v: V,
    w: 600,
    h: 800,
    fit: "cover",
    crop: "face",
    fmt: "webp",
    q: 85,
    context: "public",
    watermark: "brand",
  },
  ranking: {
    v: V,
    w: 400,
    fit: "inside",
    fmt: "webp",
    q: 85,
    context: "public",
    watermark: "brand",
  },
  profile: {
    v: V,
    w: 300,
    h: 300,
    fit: "cover",
    crop: "face",
    fmt: "webp",
    q: 85,
    context: "public",
  },
  og: {
    v: V,
    w: 1200,
    h: 630,
    fit: "cover",
    fmt: "webp",
    q: 90,
    context: "public",
    watermark: "brand",
  },
};
