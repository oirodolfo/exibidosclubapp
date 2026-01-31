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
