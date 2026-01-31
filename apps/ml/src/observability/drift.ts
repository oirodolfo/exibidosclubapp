/**
 * Drift detection: sudden drift, performance regression, label imbalance.
 * Produces DriftSignal for alerting.
 */

import type {
  ClassFrequencySnapshot,
  ConfidenceDistribution,
  DriftSignal,
  ModelPerformanceSnapshot,
  ObservabilityConfig,
} from "./types.js";
import { DEFAULT_OBSERVABILITY_CONFIG } from "./types.js";

export interface DriftInput {
  /** Current confidence distribution */
  confidence?: ConfidenceDistribution | null;
  /** Baseline confidence (e.g. last week) */
  confidenceBaseline?: ConfidenceDistribution | null;
  /** Current class frequencies */
  classFrequencies?: ClassFrequencySnapshot[] | null;
  /** Baseline class frequencies */
  classFrequencyBaseline?: ClassFrequencySnapshot[] | null;
  /** Current model performance */
  performance?: ModelPerformanceSnapshot | null;
  /** Baseline (e.g. production) performance */
  performanceBaseline?: ModelPerformanceSnapshot | null;
  /** Current annotation correction rate */
  correctionRate?: number | null;
  config?: ObservabilityConfig;
}

/**
 * Run drift checks; return signals to alert on.
 */
export function detectDrift(input: DriftInput): DriftSignal[] {
  const config = input.config ?? DEFAULT_OBSERVABILITY_CONFIG;
  const signals: DriftSignal[] = [];
  const now = new Date().toISOString();

  // 1. Confidence drift
  if (
    input.confidence &&
    input.confidenceBaseline &&
    input.confidence.p50 <
      input.confidenceBaseline.p50 - config.confidenceDriftThreshold
  ) {
    const delta = input.confidenceBaseline.p50 - input.confidence.p50;
    signals.push({
      type: "confidence",
      severity: delta > 0.2 ? "high" : delta > 0.1 ? "medium" : "low",
      message: `Confidence p50 dropped by ${delta.toFixed(3)} vs baseline`,
      details: {
        current: input.confidence.p50,
        baseline: input.confidenceBaseline.p50,
        delta,
      },
      timestamp: now,
    });
  }

  // 2. Class frequency drift
  if (input.classFrequencies && input.classFrequencyBaseline?.length) {
    const baselineByClass = new Map(
      input.classFrequencyBaseline.map((c) => [c.classLabel, c.fraction])
    );
    for (const c of input.classFrequencies) {
      const base = baselineByClass.get(c.classLabel) ?? 0;
      const delta = Math.abs(c.fraction - base);
      if (delta >= config.classFrequencyDriftThreshold) {
        signals.push({
          type: "class_frequency",
          severity: delta > 0.25 ? "high" : delta > 0.15 ? "medium" : "low",
          message: `Class ${c.classLabel} frequency changed by ${delta.toFixed(3)}`,
          details: { classLabel: c.classLabel, current: c.fraction, baseline: base, delta },
          timestamp: now,
        });
      }
    }
  }

  // 3. Performance regression
  if (
    input.performance &&
    input.performanceBaseline &&
    input.performance.macroF1 <
      input.performanceBaseline.macroF1 - config.performanceRegressionThreshold
  ) {
    const delta = input.performanceBaseline.macroF1 - input.performance.macroF1;
    signals.push({
      type: "performance",
      severity: delta > 0.1 ? "high" : delta > 0.05 ? "medium" : "low",
      message: `Model macro F1 regressed by ${delta.toFixed(3)} vs baseline`,
      details: {
        current: input.performance.macroF1,
        baseline: input.performanceBaseline.macroF1,
        delta,
      },
      timestamp: now,
    });
  }

  // 4. Correction rate too high
  if (
    input.correctionRate != null &&
    input.correctionRate > config.maxCorrectionRate
  ) {
    signals.push({
      type: "correction_rate",
      severity:
        input.correctionRate > 0.3 ? "high" : input.correctionRate > 0.2 ? "medium" : "low",
      message: `Annotation correction rate ${input.correctionRate.toFixed(3)} exceeds threshold ${config.maxCorrectionRate}`,
      details: { correctionRate: input.correctionRate, threshold: config.maxCorrectionRate },
      timestamp: now,
    });
  }

  // 5. Label imbalance (from class frequencies)
  if (input.classFrequencies?.length) {
    const counts = input.classFrequencies.map((c) => c.count);
    const minC = Math.min(...counts);
    const maxC = Math.max(...counts);
    const ratio = minC > 0 ? maxC / minC : Infinity;
    if (ratio > config.maxImbalanceRatio) {
      signals.push({
        type: "class_frequency",
        severity: ratio > 20 ? "high" : ratio > 10 ? "medium" : "low",
        message: `Label imbalance ratio ${ratio.toFixed(1)} exceeds ${config.maxImbalanceRatio}`,
        details: { ratio, maxImbalanceRatio: config.maxImbalanceRatio },
        timestamp: now,
      });
    }
  }

  return signals;
}
