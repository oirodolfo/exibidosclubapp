# IMS — Future Evolution & Extension Strategy

Extension points and long-term tradeoffs for the Image Intelligence Platform.

---

## 1. Extension points (designed for)

| Extension | How to add | Effort |
|-----------|------------|--------|
| **Video thumbnails** | New route `/v/:videoId` or same `/i/:id` with `type=video`; pipeline step: extract frame (ffmpeg/sharp). Contract: add `type`, `frame` (time or index). | Medium |
| **Animated previews** | Same as video; output GIF/WebP animated. Pipeline: decode frames, resize, re-encode. | Medium |
| **Per-user framing personalization** | SDK/IMS: accept `userId` or segment; crop engine chooses strategy from A/B or user preference (stored in DB or feature service). No new URL param if decision is server-side by segment. | Medium |
| **A/B testing of visual strategies** | Feature flags + segment in request; crop/blur/watermark strategy chosen by experiment. Metrics (observability) feed back to decide winner. | Easy (flags + metrics already in place) |
| **Paid visual boosts** | Policy layer: premium users get `watermark=none` or custom watermark; SDK/IMS resolve via subscription check. New product rule in blur/watermark resolution. | Easy |
| **Moderation overlays** | New pipeline step after blur: overlay “under review” or “removed” badge when `moderationStatus=rejected` or `pending`. IMS reads Image.moderationStatus. | Easy |
| **Legal takedown flows** | IMS returns 410/404 for imageId when takedown record exists; cache purge key by imageId (or accept eventual consistency). No change to pipeline. | Easy |

---

## 2. What is easy to add

- **New query params** — Add to parser and contracts; bump `v` if semantics change. Pipeline steps are modular (crop, blur, watermark, encode).
- **New presets** — Add to `@exibidos/ims-client` presets; no IMS change.
- **New crop/blur/watermark strategies** — New mode in contracts + new branch in crop-engine, blur-engine, watermark-engine.
- **New output formats** — Add to `OutputFormat` and pipeline encode step (e.g. AVIF).
- **Policy overrides** — Blur/watermark resolution already supports feature flags and context; add new flags or DB-backed rules.

---

## 3. What is intentionally hard to change

- **URL = cache key** — Changing the meaning of an existing param without bumping `v` would break cache correctness. Intentionally: every semantic change requires a new `v` or new param name.
- **Pipeline order** — Fetch → crop → blur → resize → watermark → encode is fixed so that cache keys and product behavior are predictable. Reordering would require a new contract version.
- **Serving originals** — IMS never serves originals; no query param can request raw file. This is a governance rule, not an accidental limitation.
- **ML as advisory only** — Product rules always override ML; the governance contract (see ML-IMS-GOVERNANCE.md) is intentionally strict so that safety and product stay in control.

---

## 4. Long-term tradeoffs

| Tradeoff | Choice | Consequence |
|----------|--------|-------------|
| **URL immutability** | Same URL ⇒ same content; version in URL | Cache-friendly; no purge on policy change. New behavior = new URL (e.g. new `v` or new param). |
| **Stateless IMS** | No server-side session; all state in URL + DB | Horizontal scaling and CDN caching are simple; personalization must be encoded in URL or resolved server-side without sticky session. |
| **Metadata at request time** | Load Image + ImageMlMetadata per request when needed | Flexible (ML metadata can change); cost is DB read. For very high QPS, consider caching metadata in IMS or at edge. |
| **Single pipeline order** | Fixed order of operations | Predictable output and testing; adding a new step (e.g. video frame extract) is a single new step in sequence, not a new pipeline. |

---

## 5. Summary

- **Easy:** New params, presets, strategies, formats, policy overrides, A/B tests, moderation/takedown.
- **Medium:** Video thumbnails, animated previews, per-user framing (needs segment/preference store).
- **Hard by design:** Changing URL semantics without versioning, serving originals, making ML authoritative.

Evolution is supported by versioned contracts, modular pipeline steps, and observability so that new use cases (video, personalization, monetization, moderation) can be added without cache invalidation disasters or loss of governance.
