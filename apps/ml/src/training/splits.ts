/**
 * Deterministic train/val/test splits with no user-level data leakage.
 * Splits by user (or task owner) so the same user never appears in multiple splits.
 */

import type { TaxonomyV1Export } from "../taxonomy/v1.js";
import type { TrainingConfig } from "./config.js";

export type SplitKind = "train" | "val" | "test";

export interface SplitResult {
  train: string[];
  val: string[];
  test: string[];
  /** User/task-owner IDs per task (for leakage check) */
  taskToOwner: Map<string, string>;
}

/**
 * Deterministic split by owner (ref or task id as proxy when owner not in payload).
 * Uses seeded shuffle so the same dataset + config always yields same splits.
 */
export function deterministicSplits(
  export_: TaxonomyV1Export,
  config: TrainingConfig,
  /** Optional: map task.id -> userId to prevent user leakage */
  taskOwner?: (taskId: string) => string
): SplitResult {
  const taskIds = export_.tasks.map((t) => t.id);
  const owner = taskOwner ?? ((id: string) => id);
  const byOwner = new Map<string, string[]>();
  for (const id of taskIds) {
    const o = owner(id);
    if (!byOwner.has(o)) byOwner.set(o, []);
    byOwner.get(o)!.push(id);
  }
  const owners = Array.from(byOwner.keys()).sort();
  const rng = seededRandom(config.seed);
  shuffle(owners, rng);

  const n = owners.length;
  const trainEnd = Math.floor(n * config.trainRatio);
  const valEnd = trainEnd + Math.floor(n * config.valRatio);

  const train: string[] = [];
  const val: string[] = [];
  const test: string[] = [];
  const taskToOwner = new Map<string, string>();

  for (let i = 0; i < owners.length; i++) {
    const o = owners[i];
    const tasks = byOwner.get(o)!;
    for (const t of tasks) taskToOwner.set(t, o);
    if (i < trainEnd) train.push(...tasks);
    else if (i < valEnd) val.push(...tasks);
    else test.push(...tasks);
  }

  return { train, val, test, taskToOwner };
}

function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

function shuffle<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
