# Automated ML Lifecycle — Operational Playbook

This document describes the end-to-end automated ML lifecycle for visual classification and region detection. It is intended for engineers who operate, debug, or extend the system.

---

## 1. End-to-End Automated ML Lifecycle

The system runs as a **production-grade, self-evolving pipeline** with no manual copy-paste of datasets, no model overwrite, and no ML inference on the request path.

### Flow Overview

```
Label Studio (human GT)  ──► Ingestion ──► Versioned Dataset Artifact
         ▲                        │
         │                        ▼
    Feedback Loop          Validation ──► Report Artifact
         │                        │
         │                   (pass?)
         │                        ▼
         │                  Training ──► Model + Metrics
         │                        │
         │                        ▼
         │                  Evaluation & Gating ──► Decision Artifact
         │                        │
         │                   (approve?)
         │                        ▼
         └──────────────  Deployment (5% → 25% → 100%)
                                    │
                              Rollout State Store
                              + Monitoring
```

### Absolute Rules

- **Everything is versioned** — datasets, models, reports, decisions.
- **No manual copy-paste of datasets** — ingestion is automated from Label Studio.
- **No model overwrite** — models are immutable artifacts; deployment is by version + rollout %.
- **No ML inference on request path** — ML runs once at upload; metadata is persisted and reused by IMS.
- **Label hierarchy** — Human labels > user (weak) labels > model labels.
- **All automation is auditable** — every stage produces artifacts (checksum, report, decision).
- **Every stage produces artifacts** — dataset_version, validation report, metrics, gate decision, deployment state.

---

## 2. Stage-by-Stage Summary

| Stage | Purpose | Key Artifacts |
|-------|---------|----------------|
| **1. Ingestion** | Pull Label Studio exports; validate taxonomy_v1; reject invalid/mixed version | `DatasetArtifact` (dataset_version, taxonomy_version, checksum) |
| **2. Weak labels** | Ingest user tags, votes, swipes as weak labels; never mix with ground truth | `WeakLabel` (source, confidence, weight) |
| **3. Validation** | Before training: schema, taxonomy, class distribution, bbox validity | `ValidationReport` (passed, checks) |
| **4. Training** | Deterministic splits; multi-head; loss weighting; metrics per class/region | `model_version`, `TrainingMetricsArtifact`, config snapshot |
| **5. Evaluation & gating** | Compare to production; enforce thresholds; detect regressions | `GateDecisionArtifact` (approve / reject / require_manual_review) |
| **6. Deployment** | Versioned rollout 5% → 25% → 100%; monitoring; instant rollback | `ModelDeployment`, rollout state |
| **7. Feedback loop** | Low-confidence + high-disagreement → Label Studio; human corrections → next dataset | `FeedbackCandidate` list |
| **8. Observability** | Drift, confidence, class frequency, correction rate, performance over time | `DriftSignal`, thresholds |

---

## 3. How to Add a New Taxonomy Version

Adding a new taxonomy version (e.g. `taxonomy_v2`) is a **controlled change** to avoid mixing versions in one dataset.

### Steps

1. **Define the new schema** in `packages/ml/src/taxonomy/` (e.g. `v2.ts`):
   - Export `TAXONOMY_VERSION = "taxonomy_v2"`.
   - Define task/annotation/region types and a validator `isTaxonomyV2Export()`.

2. **Update ingestion** in `packages/ml/src/ingestion/ingest.ts`:
   - Support multiple taxonomy versions by config (e.g. `allowedTaxonomyVersions: ["taxonomy_v1", "taxonomy_v2"]`).
   - Reject any export whose `version` is not in the allowed list (no mixed-version datasets).

3. **Update validation** in `packages/ml/src/validation/validate.ts`:
   - Add validation branch for `taxonomy_v2` (schema, class labels, region types).
   - Validation report must record `taxonomy_version`; training consumes only single-version datasets.

4. **Migration of existing data** (if needed):
   - Export from Label Studio in old format; run a one-off script to convert to new format and re-export (or re-label in Label Studio with new project config).
   - Do **not** mix v1 and v2 tasks in the same dataset artifact.

5. **Deploy**:
   - Roll out ingestion + validation + training that accept the new version; once all data is on v2, you can deprecate v1 in config.

---

## 4. How to Safely Update Thresholds

Thresholds control gating, deployment monitoring, feedback, and observability. Changing them can change **approve/reject** and **alert** behavior.

### Where thresholds live

- **Gating** (`packages/ml/src/evaluation/gating.ts`): `minMacroF1`, `minMap`, `maxClassF1Regression`, `maxRegionMapRegression`, `rejectOnRegression`.
- **Deployment monitoring** (`packages/ml/src/deployment/monitoring.ts`): `minConfidenceP50`, `maxCorrectionRate`, `maxUploadLatencyP95Ms`.
- **Feedback** (`packages/ml/src/feedback/types.ts`): `lowConfidenceThreshold`, `highDisagreementThreshold`, `maxCandidatesPerRun`.
- **Observability** (`packages/ml/src/observability/types.ts`): `confidenceDriftThreshold`, `classFrequencyDriftThreshold`, `performanceRegressionThreshold`, `maxCorrectionRate`, `maxImbalanceRatio`.

### Safe update process

1. **Make thresholds configurable** — prefer env or config file over code constants so you can change without a code deploy.
2. **Change one at a time** — e.g. lower `minMacroF1` only after verifying current model distribution.
3. **Document the change** — in a runbook or commit message: previous value, new value, reason.
4. **Monitor after change** — watch gate decisions and alerts for 24–48 hours; roll back threshold if unintended approvals or missed alerts occur.

---

## 5. How to Debug Failures

### Ingestion fails

- **Invalid or mixed taxonomy version**: Check Label Studio export `version`; ensure it is exactly `taxonomy_v1` (or allowed version). Fix Label Studio project config or export format.
- **No new or updated annotations**: Ingestion skips when `lastSeenUpdatedAt` is already ahead of all task/annotation timestamps. Normal if nothing new was labeled.
- **Store write error (e.g. "version already exists")**: That dataset version was already ingested. Use a new export or new version generator.

### Validation fails

- **Schema**: Payload does not match taxonomy (e.g. wrong field names, wrong types). Fix export or validator.
- **Taxonomy version**: Mismatch between artifact and expected version. Align ingestion and validation config.
- **Class distribution**: Too few samples per class or too imbalanced. Add more labels or relax `minSamplesPerClass` / `maxImbalanceRatio` in validation config (with care).
- **Region bbox validity**: Some regions have `x,y,w,h` outside [0,1] or `x+w > 1` etc. Fix labels in Label Studio.

### Training blocked

- Training is blocked if `validation_report.passed` is false. Fix validation first (see above).

### Gating: reject or require_manual_review

- **Below min thresholds**: Improve model or data; or lower thresholds (see “How to safely update thresholds”).
- **Regression vs production**: New model is worse than current production on some class F1 or region mAP. Either fix training/data or accept manual review and then approve with explicit override (if your process allows).

### Deployment / rollout

- **Rollout state**: Stored in `RolloutStateStore` (implementation-specific). Check current active version and rollout %.
- **Feature flag**: Use the configured feature flag key to override model version for canary or rollback.

### Feedback loop not sending enough to Label Studio

- Check `lowConfidenceThreshold` and `highDisagreementThreshold`; relax them to send more candidates.
- Check `maxCandidatesPerRun`; increase if you want more tasks per run.

### Observability alerts

- **Drift / regression / imbalance**: See `DriftSignal` and `checkThresholds` output. Adjust thresholds or fix data/model as needed.

---

## 6. How to Perform Emergency Rollback

When the current model is causing issues (e.g. bad predictions, high correction rate, or latency), roll back to the previous production model.

### Steps

1. **Identify current deployment**  
   From `RolloutStateStore.getActive()`, get `model_version` and `previous_version`.

2. **Rollback via rollout module**  
   Call `rollbackDeployment(current)` to get the new deployment object (previous version at 100%).  
   Then call `RolloutStateStore.setActive(newDeployment)` so the system now serves the previous model at 100%.

3. **Feature flag override (if used)**  
   If your upload pipeline reads model version from a feature flag, set that flag to the previous model version so all traffic uses it immediately.

4. **Verify**  
   Check monitoring: confidence, correction rate, latency. Confirm they return to acceptable levels.

5. **Post-mortem**  
   Document why rollback was needed; fix data/model/training so the next candidate does not regress.

### No in-place overwrite

Rollback does **not** overwrite the bad model. It only changes which **version** is active. The bad model remains stored as an immutable artifact for audit.

---

## 7. Glossary

- **Ground truth**: Human labels from Label Studio (taxonomy_v1).
- **Weak labels**: User-generated signals (tags, votes, swipes); stored separately; used for prioritization and semi-supervised training only.
- **Dataset artifact**: Immutable versioned export (dataset_version, taxonomy_version, checksum).
- **Validation report**: Result of pre-training checks; training is blocked if `passed` is false.
- **Gate decision**: approve / reject / require_manual_review; no model reaches production without passing gates (approve).
- **Rollout**: Gradual deployment (5% → 25% → 100%) of a model version; no in-place replace.

---

## 8. Operational Steps (Checklist)

- **Migrations**: With `.env` containing `DATABASE_URL`, run: `pnpm --filter @exibidos/db exec prisma migrate deploy` (e.g. after adding WeakLabel or schema changes).
- **Typecheck**: `pnpm run typecheck` (all packages).
- **Tests**: Run per package, e.g. `pnpm --filter @exibidos/ims-client run test`, `pnpm --filter @exibidos/ims run test` (root `pnpm run test` may pass flags that some runners do not accept).
- **Env**: Copy `env.example` to `.env` and set `LABEL_STUDIO_*` and optional `ML_DATASET_ARTIFACT_PATH` for the ML pipeline.

---

## 9. References

- **ML–IMS governance**: `docs/ML-IMS-GOVERNANCE.md` — ML informs, never controls; product rules override ML.
- **Package**: `packages/ml` — taxonomy, ingestion, weak labels, validation, training, evaluation, deployment, feedback, observability.
