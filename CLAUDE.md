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

## Banco — atenção

- **Não há migrations versionadas.** O schema é criado/alterado no startup por `backend/src/db.js`
  (`CREATE TABLE IF NOT EXISTS` e `ALTER TABLE` com erro ignorado). Toda mudança de schema precisa ser
  idempotente e testada contra uma cópia do banco de produção.
- `PRAGMA foreign_keys = ON` desde 2026-11-11 (produção verificada sem violações).
- O deploy faz backup do SQLite antes de publicar (`/opt/deploy/backups/ieclb/`).

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
