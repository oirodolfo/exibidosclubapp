# exibidos.club — System Architecture & Technical Decisions

## 1. Full System Architecture

```
                                    ┌─────────────────────────────────────────────────────────┐
                                    │                      CDN (CloudFlare / CloudFront)       │
                                    │  Static: JS, CSS, fonts · Cached: OG images, thumbnails  │
                                    └───────────────────────────┬─────────────────────────────┘
                                                                │
    ┌─────────────┐     ┌───────────────────────────────────────┼───────────────────────────────────────┐
    │   Clients   │     │                                       │                                       │
    │  (PWA/Web)  │────▶│  @exibidos/web (Next.js)              │  @exibidos/api (Fastify)              │
    │  exibidos.  │     │  - SSR / ISR / Client hydration        │  - REST + JSON                        │
    │  club       │     │  - BFF / API routes where needed       │  - Auth, uploads, business logic      │
    └─────────────┘     │  - OG image generation (server)        │  - Signed URLs, webhooks              │
                        └───────────────────┬───────────────────┴───────────────────┬───────────────────┘
                                            │                                       │
                        ┌───────────────────┼───────────────────┐   ┌───────────────┼───────────────┐
                        │     PostgreSQL    │     Redis         │   │  S3-compatible │  Vector DB    │
                        │  (Primary + rep.) │  Cache · Queues   │   │  (R2 / MinIO)  │  (pgvector /  │
                        │  Prisma ORM       │  Bull / ioredis   │   │  Images,       │   Qdrant)      │
                        │  @exibidos/db     │  Sessions         │   │  thumbnails    │  @exibidos/ml │
                        └───────────────────┘                   │   └───────────────┘   └─────────────┘
                                                                │
                        ┌───────────────────────────────────────┘
                        │  Message queue (Redis / SQS)
                        │  - Image processing (blur, watermark, thumb)
                        │  - Embedding / classification jobs
                        │  - Ranking snapshots, notifications
                        └───────────────────────────────────────
```

---

## 2. Frontend Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Framework** | Next.js 14 (App Router) | SSR, ISR, API routes, middleware (auth, redirects), OG generation, deploy flexibility |
| **UI** | React 18 | Ecosystem, @exibidos/ui shared components |
| **State** | React state + Server Components + (future) Zustand / React Query | Minimal client state; server-first data |
| **Styling** | CSS Modules / Tailwind (to be decided) | Scoped styles, design tokens in @exibidos/config |
| **Forms** | React Hook Form + Zod | Validation, DX, schema reuse with API |
| **Auth (client)** | Session cookies, `getServerSession`-style + middleware | No JWTs in localStorage; httpOnly, secure |
| **PWA** | Workbox / next-pwa, Service Worker | Offline shell, installable, push (Stage 17) |

---

## 3. Backend Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Runtime** | Node 20 LTS | Align with frontend, pnpm, TS |
| **HTTP** | Fastify | Performance, hooks, schema validation (JSON Schema / TypeBox), plugin ecosystem |
| **ORM** | Prisma | Type-safe, migrations, @exibidos/db, seed, multi-DB if needed |
| **Auth** | Custom + Passport.js or similar | NextAuth / Auth.js for Next; Fastify: JWT in httpOnly or session in Redis, OAuth (Google, X) |
| **Validation** | Zod (shared) / Fastify schema | Shared types with frontend, request/response validation |
| **Jobs** | Bull (Redis) or Inngest | Blur, watermark, thumbnails, embeddings, rankings, notifications |
| **Files** | @aws-sdk/client-s3 (R2, MinIO, S3) | Presigned upload/download, server-side watermark, no public bucket |

---

## 4. ML Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Embeddings** | Pretrained (e.g. CLIP, ResNet+encoder) via ONNX / Python microservice or TF.js | Image vectors for similarity, clustering, recommenders |
| **Vector store** | pgvector (Postgres) or Qdrant | Collocated with app DB or dedicated; filtering by user, category, visibility |
| **Classification** | Multi-label (sigmoid) on top of embeddings; human labels as target | Categories/tags; confidence scores; feedback loop |
| **Clustering** | HDBSCAN / k-means (sklearn) or batch jobs | Discovery, “similar”, trend buckets |
| **User vectors** | Aggregation of engagement (likes, votes, swipes) | Collaborative-style signals for ranking and recommendations |
| **Orchestration** | Node (Fastify) calls Python/HTTP or CLI; jobs enqueued in Redis | Versioned model artifacts; audit inputs/outputs; reprocessing |
| **Versioning** | Model digest, config in DB or S3; `ml_runs`-style table | Reproducibility, A/B, rollback |

---

## 5. Database, Cache, Queues

### 5.1 PostgreSQL (primary)

- **Role**: Users, auth, profiles, slugs, images (metadata), categories/tags, votes, swipes, rankings, badges, follows, messages, groups, tracking, feature flags, moderation, audit.
- **Extensions**: `pgvector` for image and user embeddings when used.
- **Replication**: Primary + read replicas for feed, rankings, analytics reads.
- **Migrations**: Prisma Migrate; no manual DDL in production.

### 5.2 Redis

- **Cache**: Session store, feed/ranking caches, rate-limit counters, feature-flag overrides.
- **Queues**: Bull (or similar): image pipeline (blur, watermark, thumbnails), embedding/classification, ranking snapshots, notifications.
- **Pub/Sub** (optional): Real-time (typing, presence) if needed later.

### 5.3 Queues (job types)

- `image:process` — thumbnails, blur, watermark, duplicate check.
- `ml:embed` — image → vector.
- `ml:classify` — multi-label tags, confidence.
- `rankings:snapshot` — daily/weekly/monthly/all-time, per category.
- `notifications` — push, email, in-app.

---

## 6. Object Storage (S3-compatible)

- **Provider**: Cloudflare R2 (prod), MinIO (local/dev).
- **Buckets** (logical or prefix): `exibidos-images` (originals, never public), `exibidos-thumbs`, `exibidos-og` (generated OG crops).
- **Access**: Only via **signed URLs** (upload + download). No public bucket URLs for user content.
- **Layout**: `{bucket}/{env}/{userId}/{imageId}/{variant}.{ext}` — e.g. `originals`, `thumb`, `blur`, `watermarked`, `og`.
- **Lifecycle**: Originals retained; thumbs/watermarked/og can have policies (e.g. delete if image soft-deleted).

---

## 7. CDN Strategy

- **Static assets**: JS, CSS, fonts — long cache, hash in filename; CDN (CloudFlare or CloudFront) in front of web/app.
- **Images (user)**:
  - Never serve originals through CDN.
  - Thumbnails, blur previews, watermarked images: served via **API-signed URLs** that point to S3 (or an image service) with short TTL; CDN can cache with `Cache-Control` set by API (e.g. 1h–24h) and respect `Vary` by `Authorization` or signed query.
- **OG / Social cards**: Server-rendered or pre-rendered; CDN-cacheable with key by `(slug, imageId, hash)`. Include watermark and safe crop.

---

## 8. Environment Variable Strategy

### 8.1 Naming and grouping

- Prefix by domain: `DATABASE_`, `REDIS_`, `S3_`, `OAUTH_`, `ML_`, `CDN_`, `FEATURE_`.
- No secrets in frontend; only `NEXT_PUBLIC_*` for non-sensitive config (e.g. `NEXT_PUBLIC_APP_URL`).

### 8.2 Required (all envs)

- `DATABASE_URL` — Postgres (Prisma).
- `REDIS_URL` — Redis (sessions, cache, queues).
- `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_REGION` (or `S3_FORCE_PATH_STYLE` for MinIO).
- `APP_URL` / `NEXT_PUBLIC_APP_URL` — canonical origin (links, CORS, OAuth redirects).
- `SESSION_SECRET` — signing/encryption for sessions.

### 8.3 OAuth

- `OAUTH_GOOGLE_CLIENT_ID`, `OAUTH_GOOGLE_CLIENT_SECRET`, `OAUTH_GOOGLE_CALLBACK`.
- `OAUTH_TWITTER_CLIENT_ID`, `OAUTH_TWITTER_CLIENT_SECRET`, `OAUTH_TWITTER_CALLBACK`.

### 8.4 Optional / feature-dependent

- `ML_EMBEDDING_URL` or `ML_SERVICE_URL` — when ML service is separate.
- `VECTOR_DB_URL` — if different from Postgres.
- `CDN_IMAGE_BASE` — if image URLs are rewritten to CDN.
- `FEATURE_*` — overrides for feature flags (optional).

### 8.5 Loading

- **Local**: `.env` (gitignored), `.env.example` as template.
- **Production**: Injected by platform (Vercel, Fly, K8s, etc.); no `.env` in images. Use a secret manager (e.g. Vault, Doppler) where required.

---

## 9. Local vs Production Strategy

### 9.1 Local

- **DB**: `docker compose -f infra/docker-compose.yml up -d` → Postgres, Redis, MinIO. `DATABASE_URL=postgresql://exibidos:exibidos@localhost:5432/exibidos`, `REDIS_URL=redis://localhost:6379`, S3 → MinIO on `localhost:9000`.
- **Apps**: `pnpm dev:web` (Next, port 3000), `pnpm dev:api` (Fastify, port 4000). Optional: `pnpm dev` for both.
- **Migrations**: `pnpm --filter @exibidos/db exec prisma migrate dev`.
- **Seed**: `pnpm --filter @exibidos/db run db:seed` (or `seed` script) with scenario (default, creator-heavy, etc.).
- **ML**: Optional local Python service or mocked; jobs can run synchronously or via local Redis + Bull.

### 9.2 Production

- **Build**: `pnpm install --frozen-lockfile`, `prisma generate`, `pnpm run build`. Dockerfiles in `infra/`; CI runs lint, typecheck, build.
- **Run**: `@exibidos/web`: `next start` (or Node on standalone). `@exibidos/api`: `node dist/index.js` (or tsx in dev images only).
- **DB**: Managed Postgres (e.g. Neon, RDS, Supabase); connection pooling (PgBouncer or provider) if needed.
- **Redis**: Managed (Upstash, ElastiCache, etc.); TLS in prod.
- **S3**: R2 or S3; IAM/keys with minimal scope; no public read.
- **Secrets**: From platform or secret manager; rotate `SESSION_SECRET`, OAuth, S3, DB periodically.
- **Feature flags**: DB-backed; `FEATURE_*` env overrides for emergency kill switch.

### 9.3 Differences summary

| Aspect | Local | Production |
|--------|-------|------------|
| DB | Docker Postgres | Managed Postgres |
| Redis | Docker Redis | Managed Redis |
| S3 | MinIO | R2 / S3 |
| TLS | No (localhost) | Yes (TLS termination at CDN/LB) |
| Logging | stdout, pretty | JSON, level configurable |
| Rate limits | Relaxed or off | Enforced |
| CORS | Permissive | `APP_URL` and known origins |
| Telemetry | Disabled or dev | Privacy-safe analytics, errors |

---

## 10. Privacy, Safety, Auditability

- **Privacy**: Blur/visibility on images; never serve originals; access logs for image delivery; consent and data-export hooks.
- **Safety**: Moderation status on images; block/mute; report flows; optional hashing (e.g. PhotoDNA) for CSAM if required.
- **Auditability**: `createdAt`, `updatedAt`, `createdById` where relevant; `AuditLog` (or equivalent) for sensitive actions; immutable event log for tracking/ML; model and config versioning for ML.

---

## 11. Monorepo and Deployment

- **Apps**: `apps/web`, `apps/api`. **Packages**: `@exibidos/ui`, `@exibidos/db`, `@exibidos/ml`, `@exibidos/config`.
- **CI**: Lint, typecheck, test, build; `prisma generate` before build; optional `prisma migrate deploy` in release pipeline.
- **Deploy**: Web and API as separate services; can share a reverse proxy (path or subdomain). DB migrations applied before or during release; backward-compatible schema changes preferred.
