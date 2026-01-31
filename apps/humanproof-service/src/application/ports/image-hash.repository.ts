/**
 * Port for storing approved image hashes (perceptual).
 */
export abstract class ApprovedImageHashRepository {
  abstract add(hash: string, userId: string, at: Date): Promise<void>;
  abstract hasSimilar(hash: string, threshold: number): Promise<boolean>;
  abstract listByUser(userId: string): Promise<readonly string[]>;
}

/**
 * Port for storing rejected image hashes (reused/similar).
 */
export abstract class RejectedImageHashRepository {
  abstract add(hash: string, reason: string, at: Date): Promise<void>;
  abstract hasSimilar(hash: string, threshold: number): Promise<boolean>;
}
