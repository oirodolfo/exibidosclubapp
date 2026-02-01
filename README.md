# exibidos.club

Production monorepo for **exibidos.club**. Single Git repository, multiple apps and shared packages.

---

## Architecture (high level)

```
/exibidos
├── apps/
│   ├── web/          # Next.js frontend (React, App Router)
│   └── api/          # Backend API (Fastify)
├── packages/
│   ├── ui/           # Shared UI components
│   ├── db/           # Prisma schema, client, seed
│   ├── ml/           # ML pipelines (embeddings, clustering, etc.)
│   └── config/       # Shared config and constants
└── infra/            # Docker, CI, deployment
    ├── docker-compose.yml   # Postgres, Redis, MinIO (local)
    ├── Dockerfile.web
    ├── Dockerfile.api
    └── ci.yml
```

- **apps/web**: Next.js 14, React 18. SSR, API routes for BFF when needed.
- **apps/api**: Fastify. REST/JSON. Auth, uploads, business logic, integrations.
- **packages/db**: Prisma ORM, migrations, `prisma generate`, seed scripts.
- **packages/ui**: React components and design tokens consumed by `web`.
- **packages/ml**: Python-compatible layout; TS/Node for orchestration. Image embeddings, vector DB, clustering, multi-label.
- **packages/config**: Env parsing, feature flags, app constants.

---

## Tooling

- **pnpm** workspaces
- **TypeScript** (strict, `tsconfig.base.json` extended by apps/packages)
- **ESLint** + **Prettier** (root and shared config)

---

## Environment

- **Template**: Copy `env.example` to `.env` and fill secrets. Template has all features enabled for local dev (MinIO, Postgres, Redis from `infra/docker-compose.yml`).
- **Env service**: `@exibidos/config` exports `getEnv()` (server) and `getPublicEnv()` (client-safe) with strong typings and defaults. Use instead of raw `process.env` where possible.

---

## Commands (root)

| Command        | Description                          |
|----------------|--------------------------------------|
| `pnpm install` | Install all deps                     |
| `pnpm dev`     | Run all `dev` scripts in parallel    |
| `pnpm dev:web` | Next.js (port 3000)                  |
| `pnpm dev:api` | API (port 4000)                      |
| `pnpm build`   | Build all packages and apps          |
| `pnpm lint`    | ESLint                               |
| `pnpm format`  | Prettier write                       |
| `pnpm format:check` | Prettier check                   |
| `pnpm typecheck`   | TypeScript check (all)           |

---

## Per-package

- **@exibidos/db**: `pnpm db:generate`, `pnpm db:push`, `pnpm db:migrate`, `pnpm db:studio`
- **@exibidos/web**: `pnpm dev`, `pnpm build`, `pnpm start`
- **@exibidos/api**: `pnpm dev`, `pnpm build`, `pnpm start`

---

## Local dev

1. `pnpm install`
2. `docker compose -f infra/docker-compose.yml up -d` (Postgres, Redis, MinIO)
3. `cp env.example .env` and set `DATABASE_URL`, etc. (root `.env` is loaded by db scripts.)
4. `pnpm --filter @exibidos/db run db:migrate` (when schema exists)
5. `pnpm dev` or `pnpm dev:web` and `pnpm dev:api`

---

## License

Proprietary.
