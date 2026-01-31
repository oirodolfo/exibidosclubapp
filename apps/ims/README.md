# IMS — Image Manipulation Service

Dedicated microservice for image derivatives. **Never serves original images.**

## Responsibilities

- Generate dynamic derivatives on demand
- Apply: intelligent crop, resize, optimization, encoding, blur, watermark (staged)
- Stateless and CDN-friendly
- URL-driven transformations; deterministic output; strong typing; cache-safe versioning

## Internal pipeline (transformation order)

1. **Fetch** — Load source from private S3 (internal only).
2. **Resize** — Apply width/height and fit (cover, contain, fill, inside).
3. **Optimize** — Quality and format options.
4. **Encode** — Output as JPEG or WebP.

Later stages add: crop (face/body/interest), blur (privacy), watermark. Order will remain: fetch → crop → resize → blur (if any) → watermark (if any) → encode.

## Failure handling

| Condition | HTTP | Response | Cached? |
|-----------|------|----------|--------|
| Invalid query (v, w, h, q, fit, fmt) | 400 | `{ error, message }` | No |
| Image not found or deleted | 404 | `{ error: "image_not_found" }` | No |
| Pipeline error (sharp, etc.) | 500 | `{ error: "processing_failed" }` | No |
| S3 unavailable / fetch error | 502 | `{ error: "upstream_fetch_failed" }` | No |
| Storage not configured | 503 | `{ error: "storage_unavailable" }` | No |

Success responses use `Cache-Control: public, max-age=31536000, immutable` (URL is the cache key).

## Scaling strategy

- **Stateless** — No in-memory session; every request is independent.
- **Horizontal** — Run N instances behind a load balancer.
- **CDN** — Put CDN in front; cache key = full URL (including query). Same URL ⇒ same content ⇒ long TTL.
- **Versioning** — Query param `v` (contract version). When we change semantics we bump `v`; old URLs keep working with old behavior; no cache invalidation needed.

## URL format

```
GET /i/:imageId?w=400&h=300&fit=inside&fmt=webp&q=85&v=1&crop=face
```

- `v` — Contract version (default 1). Bump when transform semantics change.
- `w`, `h` — Max width/height (optional).
- `fit` — cover | contain | fill | inside.
- `fmt` — jpeg | webp.
- `q` — Quality 1–100.
- `crop` — face | body | interest | explicit | center. ML-aware crop; fallback to center when confidence is low.
- `blur` — none | eyes | face | full. Override policy; when absent, policy + context decide.
- `context` — public | private. Blur policy context (forced blur for public, no blur for private by default). Overridable via FEATURE_BLUR_FORCE / FEATURE_BLUR_DISABLED.
- `watermark` — brand | user | none. Global brand or user-specific (exibidos.club/@slug); saliency-aware placement.
- `slug` — user slug for watermark=user (exibidos.club/@slug).

## Environment

Same as rest of stack: `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, optional `S3_ENDPOINT`, `S3_REGION`, `S3_FORCE_PATH_STYLE`. Plus `DATABASE_URL` (to resolve imageId → storageKey). `PORT` (default 4001).
