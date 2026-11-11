import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { config } from './config.js';

sqlite3.verbose();
fs.mkdirSync(path.dirname(config.databaseFile), { recursive: true });

export const db = new sqlite3.Database(config.databaseFile);
db.configure('busyTimeout', 10000);

export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) reject(error);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

export function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) reject(error);
      else resolve(row);
    });
  });
}

export function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) reject(error);
      else resolve(rows);
    });
  });
}

// O schema é definido pelas migrations em backend/migrations (ver src/migrations.js).
// Banco vazio (máquina de desenvolvimento): cria tudo. Banco existente com migration pendente: a API não sobe.
export async function initDatabase() {
  const { migrationStatus, applyMigrations } = await import('./migrations.js');
  await run('PRAGMA foreign_keys = ON');
  const status = await migrationStatus();
  if (status.problems.length) throw new Error('migrations inconsistentes: ' + status.problems.join('; '));
  if (!status.pending.length) return;
  if (status.emptyDatabase) {
    await applyMigrations();
    return;
  }
  throw new Error(
    'migrations pendentes: ' + status.pending.map((m) => m.name).join(', ') +
      '. Aplique com "npm run migrate --prefix backend" (deploy: publicar ieclb --migrate).'
  );
}
