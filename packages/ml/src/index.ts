export {
  emptyMlMetadata,
  ML_METADATA_CONTRACT_VERSION,
  type ImageMlMetadataData,
  type Region,
  type RegionWithConfidence,
  type SaliencySignal,
} from "./contracts.js";

export {
  runIngestion,
  InvalidOrMixedVersionError,
  createInMemoryDatasetStore,
  canonicalPayload,
  fetchLabelStudioExport,
  exportHasNewOrUpdatedAnnotations,
  type DatasetArtifact,
  type IngestionConfig,
  type LabelStudioConfig,
  type VersionedDatasetStore,
} from "./ingestion/index.js";

export {
  TAXONOMY_VERSION,
  REGION_TYPES,
  CLASS_LABELS,
  isTaxonomyV1Export,
  type TaxonomyV1Export,
  type TaxonomyTask,
  type TaxonomyAnnotation,
  type TaxonomyRegion,
  type RegionType,
  type ClassLabel,
} from "./taxonomy/v1.js";

export {
  normalizeUserTag,
  normalizeVote,
  normalizeSwipe,
  WEAK_LABEL_MAX_WEIGHT,
  createInMemoryWeakLabelStore,
  type WeakLabelStore,
  type WeakLabel,
  type WeakLabelSource,
  type UserTagInput,
  type VoteInput,
  type SwipeInput,
} from "./weak-labels/index.js";

export {
  validateDataset,
  type ValidateInput,
  type ValidationReport,
  type ValidationCheck,
} from "./validation/index.js";

export {
  DEFAULT_TRAINING_CONFIG,
  prepareTrainingRun,
  createMetricsPlaceholder,
  deterministicSplits,
  type TrainingConfig,
  type TrainingPipelineInput,
  type TrainingPipelineOutput,
  type TrainingMetricsArtifact,
  type ClassMetrics,
  type RegionMetrics,
  type SplitKind,
  type SplitResult,
} from "./training/index.js";

export {
  evaluateAndGate,
  DEFAULT_GATING_CONFIG,
  type GatingConfig,
  type EvaluateInput,
  type GateDecision,
  type GateDecisionArtifact,
  type GateCheck,
} from "./evaluation/index.js";
