/**
 * Training pipeline config — deterministic splits, loss weights, multi-head.
 */

export interface TrainingConfig {
  /** Train ratio (e.g. 0.7) */
  trainRatio: number;
  /** Val ratio (e.g. 0.15) */
  valRatio: number;
  /** Test ratio (e.g. 0.15); train + val + test = 1 */
  testRatio: number;
  /** Weight for weak labels (human = 1.0). Must be < 1. */
  weakLabelWeight: number;
  /** Random seed for deterministic splits */
  seed: number;
  /** Multi-head: semantic classification, region detection, policy attributes */
  heads: {
    semantic: boolean;
    region: boolean;
    policy: boolean;
  };
}

export const DEFAULT_TRAINING_CONFIG: TrainingConfig = {
  trainRatio: 0.7,
  valRatio: 0.15,
  testRatio: 0.15,
  weakLabelWeight: 0.5,
  seed: 42,
  heads: { semantic: true, region: true, policy: true },
};
