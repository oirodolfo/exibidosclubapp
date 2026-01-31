/**
 * Semantic builder for IMS URLs. Use this instead of raw query params.
 */

import type { ImageUrlParams, PresetName } from "./types.js";
import { IMS_CONTRACT_VERSION } from "./types.js";
import { PRESETS } from "./presets.js";

export interface ImageUrlBuilderOptions {
  /** Feature flag: disable blur (overrides context) */
  featureBlurDisabled?: boolean;
  /** Feature flag: force blur mode */
  featureBlurForce?: "none" | "face" | "full";
  /** Override preset context (e.g. private for close friends) */
  contextOverride?: "public" | "private";
}

export class ImageUrlBuilder {
  private params: ImageUrlParams = { v: IMS_CONTRACT_VERSION };
  private slug: string | null = null;
  private options: ImageUrlBuilderOptions = {};

  /** Start from an official preset. */
  preset(name: PresetName): this {
    this.params = { ...PRESETS[name] };
    return this;
  }

  width(w: number): this {
    this.params = { ...this.params, w };
    return this;
  }

  height(h: number): this {
    this.params = { ...this.params, h };
    return this;
  }

  fit(fit: ImageUrlParams["fit"]): this {
    this.params = { ...this.params, fit };
    return this;
  }

  format(fmt: ImageUrlParams["fmt"]): this {
    this.params = { ...this.params, fmt };
    return this;
  }

  quality(q: number): this {
    this.params = { ...this.params, q };
    return this;
  }

  crop(crop: ImageUrlParams["crop"]): this {
    this.params = { ...this.params, crop };
    return this;
  }

  /** Set context (public = apply blur policy; private = no blur). */
  context(ctx: ImageUrlParams["context"]): this {
    this.params = { ...this.params, context: ctx };
    return this;
  }

  /** User slug for watermark=user (exibidos.club/@slug). */
  userSlug(slug: string): this {
    this.slug = slug;
    this.params = { ...this.params, watermark: "user" };
    return this;
  }

  /** Feature flags / overrides (e.g. from env or feature service). */
  withOptions(options: ImageUrlBuilderOptions): this {
    this.options = { ...this.options, ...options };
    return this;
  }

  /** Build query string (deterministic, cache-safe). */
  buildQuery(): string {
    const p = { ...this.params };
    if (this.options.contextOverride) p.context = this.options.contextOverride;
    if (this.options.featureBlurDisabled) p.blur = "none";
    if (this.options.featureBlurForce != null) p.blur = this.options.featureBlurForce;
    if (this.slug) p.slug = this.slug;

    const entries = Object.entries(p).filter(
      ([, v]) => v !== undefined && v !== null && v !== ""
    ) as [string, string | number][];
    entries.sort(([a], [b]) => a.localeCompare(b));
    return entries
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&");
  }

  /** Full IMS URL for imageId. baseUrl must not include trailing slash. */
  url(baseUrl: string, imageId: string): string {
    const base = baseUrl.replace(/\/$/, "");
    const q = this.buildQuery();
    return q ? `${base}/i/${imageId}?${q}` : `${base}/i/${imageId}`;
  }
}

/** Create builder (optionally from preset). */
export function imageUrl(preset?: PresetName): ImageUrlBuilder {
  const b = new ImageUrlBuilder();
  if (preset) b.preset(preset);
  return b;
}
