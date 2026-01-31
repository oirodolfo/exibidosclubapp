# ML → IMS Governance Contract

ML must **INFORM**, never **CONTROL**. Product rules always override ML suggestions.

---

## 1. ML responsibilities (what ML can suggest)

- **Detect regions** — Face, body, interest, explicit/sensitive regions with bounding boxes and optional confidence.
- **Assign confidence** — Per-region confidence 0–1; saliency signals for “focus” of the image.
- **Produce saliency** — Center-of-interest and weights for smart crop and framing.
- **Version outputs** — All ML metadata is versioned (`contractVersion`); outputs are reproducible and replayable.

ML does **not** decide visibility, blur, watermark, or final crop. It only provides structured suggestions.

---

## 2. IMS responsibilities (what ML cannot decide)

- **Validate metadata** — Reject or ignore invalid or outdated metadata; apply safe defaults.
- **Apply product rules** — Visibility (public vs swipe_only), context (feed, profile, OG), and feature flags override any ML suggestion.
- **Enforce safety and privacy** — Blur, redaction, and access control are determined by product policy and user settings, not by ML scores alone.
- **Choose final rendering strategy** — Crop mode (face / body / interest / explicit), blur level, watermark placement are decided by IMS using ML as input plus product rules.

---

## 3. Conflict resolution

| Situation | Rule |
|-----------|------|
| ML suggests “no blur” but product policy requires blur in this context | **Product wins** — Apply blur. |
| ML suggests “blur face” but user setting is “no blur for close friends” | **Product wins** — No blur in that context. |
| ML confidence below threshold for smart crop | **IMS fallback** — Use center crop or default preset; do not use ML crop. |
| ML metadata missing or malformed | **IMS fallback** — Ignore ML; use safe defaults (e.g. center crop, no ML-driven blur). |
| Multiple faces / regions — which to prioritize? | **Product rule** — e.g. “largest face”, “first by confidence”, or A/B strategy; defined in IMS, not in ML. |

Conflicts are always resolved in favor of **product and safety**; ML is advisory only.

---

## 4. Contract versioning

- **ML metadata** — `contractVersion` in `ImageMlMetadata` and in payload; bump when region schema or semantics change.
- **IMS transform** — Query param `v` in image URLs; bump when transform semantics change so old URLs keep old behavior and cache remains valid.

ML and IMS versions are independent; IMS must support a range of metadata versions and map them to current behavior.
