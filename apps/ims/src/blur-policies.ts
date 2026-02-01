/**
 * Blur policies: configurable, versioned, overridable via feature flags.
 * Face blur, selective blur (eyes/face), forced blur for public, no blur for private.
 */

import type { BlurContext, BlurMode } from "./contracts";

export const BLUR_POLICY_VERSION = 1;

export type { BlurContext, BlurMode };

export interface BlurPolicyConfig {
  version: number;
  /** Default when context is public (e.g. feed, profile card) */
  publicDefault: BlurMode;
  /** Default when context is private (e.g. close friends, DMs) */
  privateDefault: BlurMode;
  /** When true, ML blur suggestion is respected if policy allows */
  respectMlSuggestion: boolean;
}

const DEFAULT_POLICY: BlurPolicyConfig = {
  version: BLUR_POLICY_VERSION,
  publicDefault: "face",
  privateDefault: "none",
  respectMlSuggestion: true,
};

let policyConfig: BlurPolicyConfig = DEFAULT_POLICY;

/** Set policy (e.g. from env or feature flags). Overridable at runtime. */
export function setBlurPolicy(config: Partial<BlurPolicyConfig>): void {
  policyConfig = { ...policyConfig, ...config };
}

/** Get current policy config (read-only). */
export function getBlurPolicy(): Readonly<BlurPolicyConfig> {
  return policyConfig;
}

/**
 * Resolve blur mode for a request.
 * Product rules override: feature flag can force blur on/off; then context; then ML suggestion.
 */
export function resolveBlurMode(options: {
  context: BlurContext;
  mlSuggestedBlur: boolean;
  /** Feature flag override: e.g. FEATURE_BLUR_FORCE=none|face|full */
  featureBlurForce?: BlurMode | null;
  /** Feature flag: disable blur when true */
  featureBlurDisabled?: boolean;
}): BlurMode {
  if (options.featureBlurDisabled) return "none";
  if (options.featureBlurForce != null && options.featureBlurForce !== undefined) {
    return options.featureBlurForce;
  }

  const base =
    options.context === "public" ? policyConfig.publicDefault : policyConfig.privateDefault;

  if (base === "none") return "none";
  if (!policyConfig.respectMlSuggestion) return base;
  if (options.context === "private") return policyConfig.privateDefault;
  if (options.mlSuggestedBlur) return base;
  return base;
}
