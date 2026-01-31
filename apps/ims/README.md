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

## Cache & delivery strategy

- **URL immutability** — Same URL always returns same content; cache key = full URL (path + sorted query).
- **Multi-layer** — (1) In-memory LRU in IMS when `IMS_MEMORY_CACHE_MAX` > 0; (2) Edge/CDN in front of IMS caches by URL; (3) Browser cache via `Cache-Control: public, max-age=31536000, immutable`.
- **Version-based invalidation** — Bump query param `v` when transform semantics change; old URLs keep old behavior; **changing policy does NOT require purging CDN** (new context/blur = new URL).
- **Observability** — Response header `X-IMS-Cache: hit | miss` when in-memory cache is enabled.
- **Cold starts** — Optional in-memory cache reduces repeated transforms for hot images; set `IMS_MEMORY_CACHE_MAX` (entries) and `IMS_MEMORY_CACHE_TTL` (seconds, default 3600).

## Observability & feedback

- **Structured logs** — Each request logs: `imageId`, `crop`, `w`, `h`, `context`, `watermark`, `cache` (hit/miss), `statusCode`, `durationMs`, `cacheHitRatio`. Ingest for ML training, crop strategy evolution, product decisions.
- **GET /metrics** — Returns: `requests`, `cacheHits`, `cacheMisses`, `cacheHitRatio`, `errors`, `byCrop`, `byStatus`. Use for dashboards and alerts.
- **Response header** — `X-IMS-Cache: hit | miss` for cache observability.

## Environment

Same as rest of stack: `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, optional `S3_ENDPOINT`, `S3_REGION`, `S3_FORCE_PATH_STYLE`. Plus `DATABASE_URL` (to resolve imageId → storageKey). `PORT` (default 4001). Optional: `IMS_MEMORY_CACHE_MAX` (0 = disabled), `IMS_MEMORY_CACHE_TTL` (seconds).
