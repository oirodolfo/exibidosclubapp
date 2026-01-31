/**
 * Training metrics artifact — per class and per region.
 */

export interface ClassMetrics {
  classLabel: string;
  precision: number;
  recall: number;
  f1: number;
  support: number;
}

export interface RegionMetrics {
  regionType: string;
  iouMean: number;
  iouStd: number;
  count: number;
}

export interface TrainingMetricsArtifact {
  model_version: string;
  dataset_version: string;
  /** Per-class classification metrics */
  classMetrics: ClassMetrics[];
  /** Per-region detection metrics */
  regionMetrics: RegionMetrics[];
  /** Overall (e.g. macro F1, mAP) */
  overall: {
    macroF1?: number;
    map?: number;
    loss?: number;
  };
  createdAt: string;
}
