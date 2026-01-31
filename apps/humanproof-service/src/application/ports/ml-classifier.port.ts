/**
 * ML classifier output: confidence scores per class.
 */
export interface MlClassifierOutput {
  readonly handwrittenScore: number;
  readonly photoScore: number;
  readonly rawImageScore: number;
  readonly explanation: readonly string[];
}

/**
 * Port for ML image classification (handwritten vs printed, photo vs screen, edited vs raw).
 */
export abstract class MlClassifierPort {
  abstract classify(buffer: Buffer): Promise<MlClassifierOutput>;
}
