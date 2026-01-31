/**
 * Validation report artifact — produced before any training.
 * Training is blocked if validation fails.
 */

export interface ValidationCheck {
  name: string;
  passed: boolean;
  message?: string;
  details?: Record<string, unknown>;
}

export interface ValidationReport {
  /** Dataset version this report applies to */
  dataset_version: string;
  taxonomy_version: string;
  /** Overall: training is allowed only when true */
  passed: boolean;
  checks: ValidationCheck[];
  /** Optional checksum of validated payload */
  payloadChecksum?: string;
  createdAt: string;
}
