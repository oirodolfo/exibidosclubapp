export {
  ML_METADATA_CONTRACT_VERSION,
  emptyMlMetadata,
  type Region,
  type RegionWithConfidence,
  type SaliencySignal,
  type ImageMlMetadataData,
} from "./metadata.js";

export {
  canonicalPayload,
  type DatasetArtifact,
} from "./dataset.js";

export {
  DEFAULT_ROLLOUT_STAGES,
  type RolloutStage,
  type ModelDeployment,
  type RolloutConfig,
  type ModelVersionDescriptor,
} from "./model-version.js";

export {
  type GateDecision,
  type GateCheck,
  type GateDecisionArtifact,
} from "./gating.js";

export {
  type ValidationCheck,
  type ValidationReport,
} from "./validation.js";

export {
  type ClassMetrics,
  type RegionMetrics,
  type TrainingMetricsArtifact,
} from "./metrics.js";

export {
  type WeakLabelSource,
  type WeakLabel,
  type UserTagInput,
  type VoteInput,
  type SwipeInput,
} from "./weak-labels.js";

export {
  DEFAULT_OBSERVABILITY_CONFIG,
  type ConfidenceDistribution,
  type ClassFrequencySnapshot,
  type AnnotationCorrectionRate,
  type ModelPerformanceSnapshot,
  type DriftSignal,
  type ObservabilityConfig,
} from "./observability.js";
