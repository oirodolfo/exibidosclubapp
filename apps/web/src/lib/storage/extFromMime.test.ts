/**
 * Tests for extFromMime: map MIME type to file extension for storage keys.
 */

import { describe, it, expect } from "vitest";
import { extFromMime } from "./s3";

describe("extFromMime", () => {
  it("returns jpg for image/jpeg and image/jpg", () => {
    expect(extFromMime("image/jpeg")).toBe("jpg");
    expect(extFromMime("image/jpg")).toBe("jpg");
  });

  it("returns png for image/png", () => {
    expect(extFromMime("image/png")).toBe("png");
  });

  it("returns webp for image/webp", () => {
    expect(extFromMime("image/webp")).toBe("webp");
  });

  it("returns jpg as fallback for unknown MIME", () => {
    expect(extFromMime("image/gif")).toBe("jpg");
    expect(extFromMime("application/octet-stream")).toBe("jpg");
  });
});
