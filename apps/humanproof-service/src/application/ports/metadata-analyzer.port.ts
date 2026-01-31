/**
 * Result of metadata analysis (EXIF etc.).
 */
export interface MetadataAnalysisResult {
  readonly accepted: boolean;
  readonly failureReasons: readonly string[];
  readonly cameraMake?: string;
  readonly cameraModel?: string;
  readonly dateTimeOriginal?: string;
  readonly software?: string;
}

/**
 * Port for analyzing image metadata (camera vs screen, editing, timestamp).
 */
export abstract class MetadataAnalyzer {
  abstract analyze(buffer: Buffer): Promise<MetadataAnalysisResult>;
}
