/**
 * Observability and drift monitoring types.
 */

export interface ConfidenceDistribution {
  model_version: string;
  p50: number;
  p95: number;
  p99: number;
  sampleCount: number;
  timestamp: string;
}

export interface ClassFrequencySnapshot {
  window: string;
  classLabel: string;
  count: number;
  fraction: number;
  timestamp: string;
}

export interface AnnotationCorrectionRate {
  period: string;
  rate: number;
  sampleCount: number;
  timestamp: string;
}

export interface ModelPerformanceSnapshot {
  model_version: string;
  macroF1: number;
  map: number;
  classF1: Record<string, number>;
  timestamp: string;
}

export interface DriftSignal {
  type: "confidence" | "class_frequency" | "performance" | "correction_rate";
  severity: "low" | "medium" | "high";
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface ObservabilityConfig {
  confidenceDriftThreshold: number;
  classFrequencyDriftThreshold: number;
  performanceRegressionThreshold: number;
  maxCorrectionRate: number;
  maxImbalanceRatio: number;
}

export const DEFAULT_OBSERVABILITY_CONFIG: ObservabilityConfig = {
  confidenceDriftThreshold: 0.1,
  classFrequencyDriftThreshold: 0.15,
  performanceRegressionThreshold: 0.05,
  maxCorrectionRate: 0.2,
  maxImbalanceRatio: 10,
};
