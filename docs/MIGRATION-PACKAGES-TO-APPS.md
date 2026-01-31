# Migração: packages → apps e NestJS

## Objetivo

- Reduzir redundância entre `/packages` e `/apps` (itens deixados para trás na migração para NestJS).
- Manter em **packages** apenas: **ui**, **db**, **config**.
- Mover o restante para **apps** (como libs ou serviços).
- Migrar para **NestJS** o que ainda estiver em Fastify/Express.

## Estado atual

### Packages (a mover para apps)

| Pacote           | Consumidores                                      | Ação        |
|------------------|----------------------------------------------------|-------------|
| config-nest      | Nest apps (ml-model-registry, etc.)               | → apps/config-nest |
| feature-flags   | config-nest, ml-model-registry                    | → apps/feature-flags |
| taxonomy        | ml-contracts, ml-ingestion, ml-training-orchestrator | → apps/taxonomy |
| ml-contracts     | ml-registry-client, image-service, ml-*           | → apps/ml-contracts |
| ml              | web, ims, ml-observability                        | → apps/ml |
| ml-registry-client | web                                             | → apps/ml-registry-client |
| ims-client       | image-sdk                                         | → apps/ims-client |
| image-sdk        | image-service                                     | → apps/image-sdk |
| shared-types     | (nenhum consumidor ativo no monorepo)              | → apps/shared-types ou remover |

### Apps a migrar para NestJS

| App   | Stack atual | Ação        |
|-------|--------------|-------------|
| api   | Fastify      | Migrar para NestJS |
| ims   | Fastify      | Migrar para NestJS (Image Manipulation Service) |

### Packages que permanecem

- **packages/config** — env e config base.
- **packages/db** — Prisma client e schema.
- **packages/ui** — Componentes UI compartilhados.

## Ordem de execução

1. ~~Mover pacotes de `packages/` para `apps/` (mesmo nome de pacote `@exibidos/...`; pnpm resolve por nome).~~ ✅
2. ~~Remover pastas antigas em `packages/` (exceto config, db, ui).~~ ✅
3. ~~Rodar `pnpm install` para atualizar lockfile.~~ ✅
4. ~~Migrar **api** para NestJS (health, estrutura mínima).~~ ✅
5. ~~Migrar **ims** para NestJS (rotas `/i/:imageId`, pipeline, cache, storage).~~ ✅
6. Ajustar root scripts e CI se necessário (Dockerfiles, infra/ci.yml).

## Notas

- Workspace já inclui `apps/*` e `packages/*`; não é necessário alterar `pnpm-workspace.yaml` ao mover para apps.
- Dependências entre pacotes continuam como `workspace:*`; o nome do pacote não muda.
- Após a migração, `packages/` terá apenas: config, db, ui.
