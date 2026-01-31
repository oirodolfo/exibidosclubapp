/**
 * Observability & feedback: track transformations, cache, latency, errors.
 * Signals feed ML training, crop strategy evolution, product decisions.
 */

import type { TransformSpec } from "./contracts.js";

export interface RequestMetric {
  imageId: string;
  crop?: string;
  w?: number;
  h?: number;
  context?: string;
  watermark?: string;
  cache: "hit" | "miss";
  statusCode: number;
  durationMs: number;
}

const counters = {
  requests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  errors: 0,
  byCrop: new Map<string, number>(),
  byStatus: new Map<number, number>(),
};

function specSummary(spec: TransformSpec): Pick<RequestMetric, "crop" | "w" | "h" | "context" | "watermark"> {
  return {
    ...(spec.crop && { crop: spec.crop }),
    ...(spec.w != null && { w: spec.w }),
    ...(spec.h != null && { h: spec.h }),
    ...(spec.context && { context: spec.context }),
    ...(spec.watermark && { watermark: spec.watermark }),
  };
}

/** Record a completed request for logging and metrics. */
export function recordRequest(metric: RequestMetric): void {
  counters.requests += 1;
  if (metric.cache === "hit") counters.cacheHits += 1;
  else counters.cacheMisses += 1;
  if (metric.statusCode >= 400) counters.errors += 1;
  const crop = metric.crop ?? "none";
  counters.byCrop.set(crop, (counters.byCrop.get(crop) ?? 0) + 1);
  counters.byStatus.set(
    metric.statusCode,
    (counters.byStatus.get(metric.statusCode) ?? 0) + 1
  );
}

/** Log structured event (for ingestion: ML, crop strategy, product). */
export function logRequest(
  imageId: string,
  spec: TransformSpec,
  cache: "hit" | "miss",
  statusCode: number,
  durationMs: number,
  log: { info: (o: object, msg?: string) => void }
): void {
  const metric: RequestMetric = {
    imageId,
    ...specSummary(spec),
    cache,
    statusCode,
    durationMs,
  };
  recordRequest(metric);
  log.info(
    {
      ims: "request",
      ...metric,
      cacheHitRatio: counters.requests > 0 ? counters.cacheHits / counters.requests : 0,
    },
    "ims_request"
  );
}

/** Snapshot of metrics for /metrics or monitoring. */
export function getMetrics(): {
  requests: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRatio: number;
  errors: number;
  byCrop: Record<string, number>;
  byStatus: Record<number, number>;
} {
  return {
    requests: counters.requests,
    cacheHits: counters.cacheHits,
    cacheMisses: counters.cacheMisses,
    cacheHitRatio: counters.requests > 0 ? counters.cacheHits / counters.requests : 0,
    errors: counters.errors,
    byCrop: Object.fromEntries(counters.byCrop),
    byStatus: Object.fromEntries(counters.byStatus),
  };
}
