# Infra — Docker e CI

Scripts e configs para desenvolvimento local (Docker Compose) e pipeline (CI).

---

## Desenvolvimento local com Docker

Apenas **infraestrutura** roda em containers; as aplicações (web, api, ims) rodam no host.

### O que sobe no Docker

| Serviço     | Imagem              | Portas        | Uso                    |
|------------|---------------------|---------------|------------------------|
| **postgres** | postgres:16-alpine | 5432          | Banco Prisma           |
| **redis**    | redis:7-alpine     | 6379          | Sessões, cache, filas  |
| **minio**    | minio/minio        | 9000 (API), 9001 (console) | S3-compatível (storage) |
| **minio-init** | minio/mc         | —             | Cria bucket `exibidos` na subida |

- **Volumes**: `postgres_data`, `redis_data`, `minio_data` para persistência.
- **minio-init** depende do healthcheck do MinIO e cria o bucket automaticamente; depois termina (`restart: "no"`).

### Passo a passo

1. **Subir os serviços**
   ```bash
   docker compose -f infra/docker-compose.yml up -d
   ```

2. **Aguardar ficarem saudáveis**  
   Especialmente o MinIO e o `minio-init` (criação do bucket). Sugestão: 15–30 s.
   ```bash
   docker compose -f infra/docker-compose.yml ps
   ```
   Quando `minio` estiver `healthy` e `minio-init` tiver `Exited (0)`, pode seguir.

3. **Variáveis de ambiente**
   ```bash
   cp env.example .env
   ```
   Edite `.env` se precisar (para dev local o template já aponta para localhost:5432, 6379, 9000).

4. **Dependências e banco**
   ```bash
   pnpm install
   pnpm --filter @exibidos/db exec prisma migrate dev
   pnpm --filter @exibidos/db run db:seed
   ```

5. **Rodar as apps no host**
   - Web: `pnpm dev:web` (porta 3000)
   - API: `pnpm dev:api` (porta 4000)
   - IMS: a partir de `apps/ims`, `pnpm dev` (porta 4001)

   Ou, da raiz: `pnpm dev` para o que estiver configurado no workspace.

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

- **Dockerfile.api**: imagem da API (Fastify).
- **Dockerfile.web**: imagem do Next.js.

Usados para deploy; em dev local as apps rodam no host contra Postgres/Redis/MinIO do `docker-compose`.
