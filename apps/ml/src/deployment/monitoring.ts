/**
 * Deployment monitoring — confidence drift, correction rate, latency.
 * Alert on anomalies; support instant rollback via flag.
 */

export interface DeploymentMetrics {
  /** Model version this snapshot applies to */
  model_version: string;
  /** Inference confidence distribution (e.g. p50, p95) */
  confidence: { p50: number; p95: number; sampleCount: number };
  /** Annotation correction rate (human overrides / total) */
  annotationCorrectionRate: number;
  /** Upload pipeline latency (ms) — p95 */
  uploadLatencyP95Ms: number;
  /** Timestamp of snapshot (ISO) */
  timestamp: string;
}

export interface MonitoringThresholds {
  /** Alert if confidence p50 drops below */
  minConfidenceP50: number;
  /** Alert if correction rate exceeds */
  maxCorrectionRate: number;
  /** Alert if upload latency p95 exceeds (ms) */
  maxUploadLatencyP95Ms: number;
}

export const DEFAULT_MONITORING_THRESHOLDS: MonitoringThresholds = {
  minConfidenceP50: 0.5,
  maxCorrectionRate: 0.2,
  maxUploadLatencyP95Ms: 5000,
};

/** Check deployment metrics against thresholds; return violations. */
export function checkThresholds(
  metrics: DeploymentMetrics,
  thresholds: MonitoringThresholds = DEFAULT_MONITORING_THRESHOLDS
): { ok: boolean; violations: string[] } {
  const violations: string[] = [];
  if (metrics.confidence.p50 < thresholds.minConfidenceP50) {
    violations.push(
      `confidence_p50 ${metrics.confidence.p50} < ${thresholds.minConfidenceP50}`
    );
  }
  if (metrics.annotationCorrectionRate > thresholds.maxCorrectionRate) {
    violations.push(
      `annotation_correction_rate ${metrics.annotationCorrectionRate} > ${thresholds.maxCorrectionRate}`
    );
  }
  if (metrics.uploadLatencyP95Ms > thresholds.maxUploadLatencyP95Ms) {
    violations.push(
      `upload_latency_p95_ms ${metrics.uploadLatencyP95Ms} > ${thresholds.maxUploadLatencyP95Ms}`
    );
  }
  return { ok: violations.length === 0, violations };
}
