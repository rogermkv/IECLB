// Migrations versionadas do IECLB (SQLite, sem Prisma).
//
// - Cada mudança de schema é um arquivo novo em backend/migrations/NNNN_descricao.sql (nunca editar um já aplicado).
// - A tabela schema_migrations registra nome + sha256 de cada migration aplicada.
// - Produção/DEV: o deploy confere as pendentes e só aplica com `publicar ieclb --migrate` (backup antes).
// - Desenvolvimento local: `npm run migrate --prefix backend`. Banco vazio é criado automaticamente no start.
// - A API não sobe com migration pendente (o deploy volta para a versão anterior).
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { db, run, all } from './db.js';

export const migrationsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
const BASELINE = '0001_baseline';
const SCHEMA_QUERY =
  "SELECT type, name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND name <> 'schema_migrations' ORDER BY type, name";

const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');
const execOn = (database, sql) => new Promise((resolve, reject) => database.exec(sql, (e) => (e ? reject(e) : resolve())));
const allOn = (database, sql) => new Promise((resolve, reject) => database.all(sql, (e, rows) => (e ? reject(e) : resolve(rows))));
const normalize = (rows) =>
  JSON.stringify(rows.map((r) => [r.type, r.name, String(r.sql || '').replace(/\s+/g, ' ').replace(/\s*([(),])\s*/g, '$1').trim()]));

export function listMigrations() {
  return fs
    .readdirSync(migrationsDir)
    .filter((f) => /^\d{4}_[a-z0-9_]+\.sql$/.test(f))
    .sort()
    .map((f) => {
      const sql = fs.readFileSync(path.join(migrationsDir, f), 'utf8');
      return { name: f.slice(0, -4), sql, checksum: sha256(sql) };
    });
}

async function appliedMigrations() {
  const exists = await all("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'");
  if (!exists.length) return new Map();
  return new Map((await all('SELECT name, checksum FROM schema_migrations')).map((r) => [r.name, r.checksum]));
}

// Somente leitura: não altera o banco.
export async function migrationStatus() {
  const files = listMigrations();
  const applied = await appliedMigrations();
  const problems = [];
  for (const [name, checksum] of applied) {
    const file = files.find((m) => m.name === name);
    if (!file) problems.push(`aplicada no banco mas sem arquivo: ${name}`);
    else if (file.checksum !== checksum) problems.push(`arquivo alterado depois de aplicado: ${name}`);
  }
  const tables = await all(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name <> 'schema_migrations'"
  );
  return {
    pending: files.filter((m) => !applied.has(m.name)),
    problems,
    emptyDatabase: tables.length === 0,
    // banco criado antes das migrations versionadas: o baseline é conferido e só registrado
    adoptBaseline: tables.length > 0 && applied.size === 0
  };
}

async function baselineMatchesDatabase(sql) {
  const memory = new sqlite3.Database(':memory:');
  try {
    await execOn(memory, sql);
    return normalize(await allOn(memory, SCHEMA_QUERY)) === normalize(await all(SCHEMA_QUERY));
  } finally {
    memory.close();
  }
}

export async function applyMigrations({ log = console.log } = {}) {
  const status = await migrationStatus();
  if (status.problems.length) throw new Error('migrations inconsistentes: ' + status.problems.join('; '));
  if (!status.pending.length) return [];
  await run('PRAGMA busy_timeout = 10000');
  await run(
    'CREATE TABLE IF NOT EXISTS schema_migrations (' +
      'name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)'
  );
  const done = [];
  for (const migration of status.pending) {
    if (migration.name === BASELINE && status.adoptBaseline) {
      if (!(await baselineMatchesDatabase(migration.sql))) {
        throw new Error(`o schema do banco existente não confere com ${BASELINE}; nada foi alterado`);
      }
      await run('INSERT INTO schema_migrations (name, checksum) VALUES (?, ?)', [migration.name, migration.checksum]);
      log(`adotada (o banco existente confere com o baseline): ${migration.name}`);
      done.push(migration.name);
      continue;
    }
    await execOn(db, 'BEGIN IMMEDIATE');
    try {
      await execOn(db, migration.sql);
      await run('INSERT INTO schema_migrations (name, checksum) VALUES (?, ?)', [migration.name, migration.checksum]);
      await execOn(db, 'COMMIT');
    } catch (error) {
      await execOn(db, 'ROLLBACK').catch(() => {});
      throw new Error(`${migration.name}: ${error.message} (nada desta migration foi aplicado)`);
    }
    log(`aplicada: ${migration.name}`);
    done.push(migration.name);
  }
  const violations = await all('PRAGMA foreign_key_check');
  if (violations.length) throw new Error(`foreign_key_check encontrou ${violations.length} violação(ões)`);
  return done;
}
