/**
 * Automated model evaluation and gating.
 * Compares new model to production; enforces thresholds; detects regressions;
 * produces approve / reject / require_manual_review with decision artifact.
 */

import type { TrainingMetricsArtifact } from "../training/metrics";
import type { GateCheck, GateDecision, GateDecisionArtifact } from "./types";

export interface GatingConfig {
  /** Minimum macro F1 to approve (no production baseline) */
  minMacroF1: number;
  /** Minimum mAP for region detection to approve */
  minMap: number;
  /** Max allowed drop vs production per class (F1 delta) — triggers reject or review */
  maxClassF1Regression: number;
  /** Max allowed drop vs production for region mAP */
  maxRegionMapRegression: number;
  /** If regression detected: reject (true) or require_manual_review (false) */
  rejectOnRegression: boolean;
}

export const DEFAULT_GATING_CONFIG: GatingConfig = {
  minMacroF1: 0.6,
  minMap: 0.5,
  maxClassF1Regression: 0.05,
  maxRegionMapRegression: 0.05,
  rejectOnRegression: false,
};

export interface EvaluateInput {
  candidate: TrainingMetricsArtifact;
  production: TrainingMetricsArtifact | null;
  config: GatingConfig;
}

/**
 * Run gating: compare candidate to production, enforce thresholds, detect regressions.
 * Returns decision artifact; no model reaches production without passing gates.
 */
export function evaluateAndGate(input: EvaluateInput): GateDecisionArtifact {
  const checks: GateCheck[] = [];
  const metricDeltas: Record<string, number> = {};
  const candidate = input.candidate;
  const production = input.production;
  const config = input.config;

  // 1. Minimum absolute thresholds (no baseline)
  const macroF1 = candidate.overall.macroF1 ?? 0;
  const map = candidate.overall.map ?? 0;
  checks.push({
    name: "min_macro_f1",
    passed: macroF1 >= config.minMacroF1,
    message: macroF1 >= config.minMacroF1 ? undefined : `macroF1 ${macroF1} < ${config.minMacroF1}`,
    details: { macroF1, threshold: config.minMacroF1 },
  });
  checks.push({
    name: "min_map",
    passed: map >= config.minMap,
    message: map >= config.minMap ? undefined : `mAP ${map} < ${config.minMap}`,
    details: { map, threshold: config.minMap },
  });

  // 2. Regression vs production (per class, per region)
  let hasRegression = false;
  if (production) {
    const prodByClass = new Map(
      production.classMetrics.map((c) => [c.classLabel, c])
    );
    for (const c of candidate.classMetrics) {
      const prodF1 = prodByClass.get(c.classLabel)?.f1 ?? 1;
      const delta = prodF1 - c.f1;
      if (delta > config.maxClassF1Regression) {
        hasRegression = true;
        metricDeltas[`class_${c.classLabel}_f1`] = -delta;
      }
    }
    const prodMap =
      production.regionMetrics.length > 0
        ? production.overall.map ?? 0
        : 0;
    const candMap = candidate.overall.map ?? 0;
    const mapDelta = prodMap - candMap;
    if (mapDelta > config.maxRegionMapRegression) {
      hasRegression = true;
      metricDeltas["region_map"] = -mapDelta;
    }
    checks.push({
      name: "no_regression",
      passed: !hasRegression,
      message: hasRegression
        ? "Regression detected vs production (class F1 or region mAP)"
        : undefined,
      details: hasRegression ? { metricDeltas } : undefined,
    });
  } else {
    checks.push({
      name: "no_regression",
      passed: true,
      message: "No production baseline; skip regression check",
    });
  }

  const allPassed = checks.every((c) => c.passed);
  let decision: GateDecision;
  let reason: string;

  if (allPassed && !hasRegression) {
    decision = "approve";
    reason = "All gates passed; candidate meets thresholds and does not regress vs production.";
  } else if (hasRegression && config.rejectOnRegression) {
    decision = "reject";
    reason =
      "Regression vs production detected and rejectOnRegression is true.";
  } else if (!allPassed || hasRegression) {
    decision = "require_manual_review";
    reason = !allPassed
      ? "Minimum thresholds not met or regression detected; manual review required."
      : "Regression detected; manual review required.";
  } else {
    decision = "approve";
    reason = "All gates passed.";
  }

  return {
    candidate_version: candidate.model_version,
    production_version: production?.model_version ?? null,
    decision,
    reason,
    checks,
    metricDeltas: Object.keys(metricDeltas).length > 0 ? metricDeltas : undefined,
    createdAt: new Date().toISOString(),
  };
}
