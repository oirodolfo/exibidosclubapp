/**
 * Tests for ImageUrlBuilder: query building, presets, URL generation.
 */

import { describe, it, expect } from "vitest";
import { imageUrl, ImageUrlBuilder, PRESETS, IMS_CONTRACT_VERSION } from "./index";

const IMS_BASE = "https://ims.example.com";

describe("imageUrl()", () => {
  it("returns a builder with default version when no preset", () => {
    const b = imageUrl();
    const q = b.buildQuery();
    expect(q).toContain(`v=${IMS_CONTRACT_VERSION}`);
  });

  it("returns a builder with preset when given preset name", () => {
    const b = imageUrl("feed");
    const q = b.buildQuery();
    expect(q).toContain("w=800");
    expect(q).toContain("fit=inside");
    expect(q).toContain("context=public");
    expect(q).toContain("watermark=brand");
  });
});

describe("ImageUrlBuilder.buildQuery()", () => {
  it("produces deterministic sorted query string", () => {
    const b = imageUrl("profile").width(200);
    const q1 = b.buildQuery();
    const q2 = b.buildQuery();
    expect(q1).toBe(q2);
    expect(q1).toMatch(/^[a-z&=0-9]+$/);
  });

  it("includes user slug when userSlug() is called", () => {
    const b = imageUrl("feed").userSlug("jane");
    const q = b.buildQuery();
    expect(q).toContain("slug=jane");
    expect(q).toContain("watermark=user");
  });

  it("applies contextOverride when set in options", () => {
    const b = imageUrl("feed").withOptions({ contextOverride: "private" });
    const q = b.buildQuery();
    expect(q).toContain("context=private");
  });

  it("applies featureBlurDisabled when set in options", () => {
    const b = imageUrl("feed").withOptions({ featureBlurDisabled: true });
    const q = b.buildQuery();
    expect(q).toContain("blur=none");
  });
});

describe("ImageUrlBuilder.url()", () => {
  it("builds full IMS URL with imageId and query", () => {
    const b = imageUrl("feed");
    const url = b.url(IMS_BASE, "img-123");
    expect(url).toBe(`${IMS_BASE}/i/img-123?${b.buildQuery()}`);
  });

  it("omits query when only version default", () => {
    const b = new ImageUrlBuilder();
    const url = b.url(IMS_BASE, "img-456");
    expect(url).toMatch(new RegExp(`^${IMS_BASE.replace(".", "\\.")}/i/img-456`));
  });
});

describe("PRESETS", () => {
  it("defines all preset names with version and safe defaults", () => {
    const names = ["feed", "swipe", "ranking", "profile", "og"] as const;
    for (const name of names) {
      const p = PRESETS[name];
      expect(p).toBeDefined();
      expect(p!.v).toBe(IMS_CONTRACT_VERSION);
      expect(p!.context).toBe("public");
    }
  });

  it("og preset has OG card dimensions", () => {
    expect(PRESETS.og.w).toBe(1200);
    expect(PRESETS.og.h).toBe(630);
  });
});
