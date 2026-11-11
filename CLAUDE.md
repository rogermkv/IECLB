# IECLB — Agenda digital da Igreja IECLB de Santa Rosa/RS

Eventos, inscrições/RSVP (por `device_token`), avisos, pedidos de oração e área da secretaria (JWT).

## Estrutura

`frontend/` (React + Vite, JavaScript) e `backend/` (Express + SQLite, JavaScript). Sem TypeScript e sem Prisma.

## Comandos (no .98, em `~/projetos/ieclb`)

```
npm ci --prefix backend && npm ci --prefix frontend
npm run build          # build do frontend
npm run backend        # API em modo watch
npm run frontend       # Vite
```

## Ambientes

| | DEV (.98) | Produção (.99) |
|---|---|---|
| URL | http://192.168.0.98:8081 | https://ieclb.sistemasmkv.com.br |
| API | 127.0.0.1:3335 (`/health`) | 127.0.0.1:3335 (`/health`) |
| Banco | SQLite (`DATABASE_FILE`) | `/opt/apps/ieclb/data/database.sqlite` |
| Atualizar | `publicar ieclb --dev` | `publicar ieclb` |

## Banco e migrations

- **Migrations versionadas** (desde 2026-11-11) em `backend/migrations/NNNN_descricao.sql`, registradas na tabela
  `schema_migrations` (nome + sha256). Runner: `backend/src/migrations.js`; CLI `backend/scripts/migrate.js`.
- Mudança de schema = **arquivo novo** com o próximo número (ex.: `0002_add_event_color.sql`). Nunca editar nem apagar
  uma migration já aplicada (o status acusa "arquivo alterado" e o deploy para). Cada arquivo roda numa transação;
  `PRAGMA foreign_keys` não pode ser trocado dentro dela.
- Comandos (em `backend/`): `npm run migrate:status` (só lê) e `npm run migrate` (aplica).
- Deploy: as pendentes aparecem no deploy; aplicar com `publicar ieclb --dev --migrate` / `publicar ieclb --migrate`
  (backup antes). A API **não sobe** com migration pendente num banco existente; banco vazio é criado no start.
- `0001_baseline` = schema de 2026-11-11 (igual na produção e no DEV). Bancos antigos são "adotados": o schema é
  conferido com o baseline e só registrado.
- O antigo `initDatabase()` com `CREATE TABLE IF NOT EXISTS`/`ALTER TABLE` ignorando erro foi removido; ele também
  reativava os usuários `admin` e `secretaria` a cada start (não acontece mais).
- `PRAGMA foreign_keys = ON` desde 2026-11-11 (produção verificada sem violações).

## Outros

- `render.yaml` e os scripts `render:*` são de uma hospedagem antiga (Render) e não são usados.
- `ops/devsigec/` (não versionado) tem arquivos da montagem do .98 em 2026-10-12.

## Regras gerais

- Contexto geral (máquinas, deploy, regras): `~/projetos/mkv-deploy/CLAUDE.md`.
- Trabalhar sempre no `main`, depois de `git status` e `git fetch`; não começar sobre base desatualizada.
- Produção só recebe código via `publicar`. Nunca editar produção à mão.
- Nunca `prisma migrate reset`, `db push` em produção, seed destrutivo ou apagar dados sem autorização explícita.
- Nunca versionar `.env`, senhas, tokens ou `DATABASE_URL` com senha.
- Ao terminar algo relevante: atualizar `docs/PROJECT_STATE.md` e acrescentar entrada em `docs/DEVLOG.md` (append-only).
