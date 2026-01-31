/**
 * Tests for cache key building (deterministic, sorted).
 */

import { describe, it, expect } from "vitest";
import { cacheKey } from "./cache.js";

describe("cacheKey", () => {
  it("returns imageId when query is empty", () => {
    expect(cacheKey("img-1", {})).toBe("img-1");
    expect(cacheKey("img-1", { w: undefined, h: undefined })).toBe("img-1");
  });

  it("produces same key for same params in different order", () => {
    const q1 = { w: "400", h: "300", fmt: "webp" };
    const q2 = { fmt: "webp", h: "300", w: "400" };
    expect(cacheKey("img-1", q1)).toBe(cacheKey("img-1", q2));
  });

  it("sorts query params alphabetically", () => {
    const q = { z: "1", a: "2", m: "3" };
    const key = cacheKey("id", q);
    expect(key).toBe("id:a=2&m=3&z=1");
  });

  it("excludes undefined and empty string values", () => {
    const q = { w: "400", h: undefined, fmt: "" };
    const key = cacheKey("id", q);
    expect(key).toBe("id:w=400");
  });
});
