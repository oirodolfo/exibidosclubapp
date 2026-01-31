/**
 * Observability and drift monitoring.
 * Track: dataset drift, confidence distribution, class frequency, correction rates, model performance.
 * Alert on: sudden drift, performance regression, label imbalance.
 */

export interface ConfidenceDistribution {
  /** Model version */
  model_version: string;
  /** Percentiles (0–1) */
  p50: number;
  p95: number;
  p99: number;
  sampleCount: number;
  timestamp: string;
}

export interface ClassFrequencySnapshot {
  /** Dataset or inference window */
  window: string;
  classLabel: string;
  count: number;
  fraction: number;
  timestamp: string;
}

export interface AnnotationCorrectionRate {
  /** Period (e.g. daily) */
  period: string;
  /** Corrections / total annotations */
  rate: number;
  sampleCount: number;
  timestamp: string;
}

export interface ModelPerformanceSnapshot {
  model_version: string;
  macroF1: number;
  map: number;
  /** Per-class F1 */
  classF1: Record<string, number>;
  timestamp: string;
}

export interface DriftSignal {
  /** Type of drift */
  type: "confidence" | "class_frequency" | "performance" | "correction_rate";
  /** Severity: low | medium | high */
  severity: "low" | "medium" | "high";
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface ObservabilityConfig {
  /** Alert if confidence p50 drops by more than this vs baseline */
  confidenceDriftThreshold: number;
  /** Alert if class fraction changes by more than this */
  classFrequencyDriftThreshold: number;
  /** Alert if performance (macro F1) drops by more than this */
  performanceRegressionThreshold: number;
  /** Alert if correction rate exceeds this */
  maxCorrectionRate: number;
  /** Alert if label imbalance ratio exceeds this */
  maxImbalanceRatio: number;
}

export const DEFAULT_OBSERVABILITY_CONFIG: ObservabilityConfig = {
  confidenceDriftThreshold: 0.1,
  classFrequencyDriftThreshold: 0.15,
  performanceRegressionThreshold: 0.05,
  maxCorrectionRate: 0.2,
  maxImbalanceRatio: 10,
};
