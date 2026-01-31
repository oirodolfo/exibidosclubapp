# Infra — Docker e CI

Scripts e configs para desenvolvimento local (Docker Compose) e pipeline (CI).

---

## Full stack via Docker Compose (recomendado)

Todo o sistema sobe com um único comando a partir da **raiz do repositório**:

```bash
docker compose -f infra/docker-compose.yml up -d
```

### Serviços

| Serviço       | Porta  | Uso |
|---------------|--------|-----|
| **postgres**  | 5432   | Banco Prisma |
| **redis**     | 6379   | Sessões, cache |
| **minio**     | 9000, 9001 | S3 (API + console) |
| **minio-init** | —      | Cria bucket `exibidos` (one-off) |
| **migrate**   | —      | Roda `prisma migrate deploy` (one-off) |
| **web**       | 3000   | Next.js — http://localhost:3000 |
| **api**       | 4000   | API Fastify — http://localhost:4000 |
| **ims**       | 4001   | Image Manipulation Service (legacy) — http://localhost:4001 |
| **image-service** | 4002 | NestJS Image Manipulation Service — http://localhost:4002 |
| **ml-ingestion** | 4010 | NestJS Label Studio + weak label ingestion — http://localhost:4010 |
| **ml-training-orchestrator** | 4011 | NestJS training orchestration — http://localhost:4011 |
| **ml-model-registry** | 4012 | NestJS model registry — http://localhost:4012 |
| **ml-observability** | 4013 | NestJS observability & drift — http://localhost:4013 |

- **migrate** roda após Postgres ficar healthy e termina; **web** e **api** só sobem depois do migrate.
- Variáveis de ambiente (DB, Redis, S3, SESSION_SECRET) estão definidas no compose; para produção, use um `.env` e `SESSION_SECRET` real.

### Comandos úteis

```bash
# Subir
docker compose -f infra/docker-compose.yml up -d

# Logs
docker compose -f infra/docker-compose.yml logs -f web

# Parar
docker compose -f infra/docker-compose.yml down

# Rebuild após mudanças no código
docker compose -f infra/docker-compose.yml up -d --build
```

### Seed (opcional)

Após a primeira subida, para popular o banco:

```bash
docker compose -f infra/docker-compose.yml run --rm -e DATABASE_URL=postgresql://exibidos:exibidos@postgres:5432/exibidos web sh -c "cd /app && pnpm --filter @exibidos/db run db:seed"
```

---

## Desenvolvimento local — só infra no Docker

Se quiser rodar **apenas a infraestrutura** em containers e as apps (web, api, ims) no host:

1. Comente ou remova no `docker-compose.yml` os serviços **migrate**, **web**, **api**, **ims** (ou use um profile).
2. Suba só a infra:
   ```bash
   docker compose -f infra/docker-compose.yml up -d postgres redis minio minio-init
   ```
3. No host: `cp env.example .env`, `pnpm install`, `pnpm --filter @exibidos/db exec prisma migrate dev`, `pnpm dev:web` (e opcionalmente api/ims).

### O que sobe no Docker (só infra)

| Serviço     | Imagem              | Portas        | Uso                    |
|------------|---------------------|---------------|------------------------|
| **postgres** | postgres:16-alpine | 5432          | Banco Prisma           |
| **redis**    | redis:7-alpine     | 6379          | Sessões, cache, filas  |
| **minio**    | minio/minio        | 9000 (API), 9001 (console) | S3-compatível (storage) |
| **minio-init** | minio/mc         | —             | Cria bucket `exibidos` na subida |

- **Volumes**: `postgres_data`, `redis_data`, `minio_data` para persistência.
- **minio-init** depende do healthcheck do MinIO e cria o bucket automaticamente; depois termina (`restart: "no"`).

### Verificar serviços

- **Postgres**: `psql postgresql://exibidos:exibidos@localhost:5432/exibidos -c "SELECT 1"`
- **Redis**: `redis-cli -h localhost -p 6379 ping`
- **MinIO**: Console em http://localhost:9001 (user `exibidos`, senha `exibidos`). Bucket `exibidos` deve existir após o `minio-init`.

### Troubleshooting

- **MinIO healthcheck**: O healthcheck usa `curl -f http://localhost:9000/minio/health/live`. Se a imagem MinIO que você usar não tiver `curl`, o container pode ficar `unhealthy`; nesse caso use uma imagem que inclua curl ou altere o `healthcheck` para um comando disponível na imagem (ex.: `mc` ou script que use outra ferramenta).
- **Bucket não existe**: Confirme que `minio-init` rodou após o MinIO ficar healthy: `docker compose -f infra/docker-compose.yml logs minio-init`. Se tiver falha de rede/DNS entre containers, suba de novo após o MinIO estável.
- **Conexão recusada na app**: Confirme que Postgres/Redis/MinIO estão com as portas mapeadas e que o `.env` usa `localhost` e as portas acima.

---

## CI

- **infra/ci.yml**: pipeline (lint, typecheck, build, testes). Ajuste o path do workflow conforme seu host (GitHub Actions, etc.).

---

## Build de imagens (produção)

- **Dockerfile.web**: imagem do Next.js.
- **Dockerfile.api**: imagem da API (Fastify).
- **Dockerfile.ims**: imagem do IMS (Image Manipulation Service, legacy).
- **Dockerfile.image-service**: NestJS Image Manipulation Service.
- **Dockerfile.ml-ingestion**: NestJS Label Studio + weak label ingestion.
- **Dockerfile.ml-training-orchestrator**: NestJS training orchestration.
- **Dockerfile.ml-model-registry**: NestJS model registry.
- **Dockerfile.ml-observability**: NestJS observability & drift.
- **Dockerfile.migrate**: one-off para `prisma migrate deploy`.

Usados pelo `docker-compose` (full stack) ou para deploy; em dev local você pode rodar só a infra e as apps no host.
