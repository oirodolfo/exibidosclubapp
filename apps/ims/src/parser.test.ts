/**
 * Tests for parseTransformSpec: validation, defaults, error codes.
 */

import { describe, it, expect } from "vitest";
import { parseTransformSpec } from "./parser.js";
import { DEFAULTS, TRANSFORM_CONTRACT_VERSION } from "./contracts.js";

describe("parseTransformSpec", () => {
  it("returns default spec when query is empty", () => {
    const result = parseTransformSpec({});
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.spec.v).toBe(TRANSFORM_CONTRACT_VERSION);
      expect(result.spec.fit).toBe(DEFAULTS.fit);
      expect(result.spec.fmt).toBe(DEFAULTS.fmt);
      expect(result.spec.q).toBe(DEFAULTS.q);
    }
  });

  it("parses w and h", () => {
    const result = parseTransformSpec({ w: "400", h: "300" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.spec.w).toBe(400);
      expect(result.spec.h).toBe(300);
    }
  });

  it("rejects invalid version (0)", () => {
    const result = parseTransformSpec({ v: "0" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("invalid_version");
      expect(result.message).toContain("1");
    }
  });

  it("rejects invalid version (100)", () => {
    const result = parseTransformSpec({ v: "100" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("invalid_version");
  });

  it("rejects width out of bounds", () => {
    const result = parseTransformSpec({ w: "9999" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("invalid_dimension");
      expect(result.message).toContain("w");
    }
  });

  it("rejects quality out of bounds", () => {
    const result = parseTransformSpec({ q: "0" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("invalid_quality");
  });

  it("parses fit and fmt aliases", () => {
    const result = parseTransformSpec({ fit: "cover", fmt: "webp" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.spec.fit).toBe("cover");
      expect(result.spec.fmt).toBe("webp");
    }
  });

  it("parses crop and blur", () => {
    const result = parseTransformSpec({ crop: "face", blur: "full" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.spec.crop).toBe("face");
      expect(result.spec.blur).toBe("full");
    }
  });

  it("parses context and watermark", () => {
    const result = parseTransformSpec({ context: "private", watermark: "user", slug: "jane" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.spec.context).toBe("private");
      expect(result.spec.watermark).toBe("user");
      expect(result.spec.slug).toBe("jane");
    }
  });
});
