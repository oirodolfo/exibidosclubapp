# Cloudflare R2 — Required env vars

| Variable | Required | Description |
|----------|----------|-------------|
| R2_ACCOUNT_ID | Yes (for R2) | Cloudflare account ID |
| R2_ACCESS_KEY_ID | Yes (for R2) | R2 API token access key |
| R2_SECRET_ACCESS_KEY | Yes (for R2) | R2 API token secret |
| R2_BUCKET | Yes (for R2) | Bucket name (private) |
| CDN_BASE_URL | Yes (for CDN) | Base URL for processed assets (e.g. https://cdn.exibidos.com) |
| REDIS_URL | Yes (for queues) | Redis connection URL (e.g. redis://localhost:6379) |

**R2 bucket key conventions**

- `original/` — raw uploads
- `processed/` — processed variants (e.g. `processed/{imageId}/{variant}.webp`)
