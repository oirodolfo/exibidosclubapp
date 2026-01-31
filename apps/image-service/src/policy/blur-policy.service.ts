import { Injectable } from "@nestjs/common";
import type { BlurContext, BlurMode } from "../transform/contracts.js";

export const BLUR_POLICY_VERSION = 1;

export interface BlurPolicyConfig {
  version: number;
  publicDefault: BlurMode;
  privateDefault: BlurMode;
  respectMlSuggestion: boolean;
}

const DEFAULT_POLICY: BlurPolicyConfig = {
  version: BLUR_POLICY_VERSION,
  publicDefault: "face",
  privateDefault: "none",
  respectMlSuggestion: true,
};

@Injectable()
export class BlurPolicyService {
  private config: BlurPolicyConfig = { ...DEFAULT_POLICY };

  setConfig(config: Partial<BlurPolicyConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): Readonly<BlurPolicyConfig> {
    return this.config;
  }

  /**
   * Resolve blur mode for a request.
   * Product rules override: feature flag → context → ML suggestion.
   */
  resolveBlurMode(options: {
    context: BlurContext;
    mlSuggestedBlur: boolean;
    featureBlurForce?: BlurMode | null;
    featureBlurDisabled?: boolean;
  }): BlurMode {
    if (options.featureBlurDisabled) return "none";
    if (options.featureBlurForce != null && options.featureBlurForce !== undefined) {
      return options.featureBlurForce;
    }
    const base =
      options.context === "public" ? this.config.publicDefault : this.config.privateDefault;
    if (base === "none") return "none";
    if (!this.config.respectMlSuggestion) return base;
    if (options.context === "private") return this.config.privateDefault;
    if (options.mlSuggestedBlur) return base;
    return base;
  }
}
