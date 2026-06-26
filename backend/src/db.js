import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { config } from './config.js';

sqlite3.verbose();
fs.mkdirSync(path.dirname(config.databaseFile), { recursive: true });

export const db = new sqlite3.Database(config.databaseFile);

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

export async function initDatabase() {
  await run(
    'CREATE TABLE IF NOT EXISTS events (' +
      'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
      'date TEXT NOT NULL,' +
      'start_time TEXT,' +
      'end_time TEXT,' +
      'title TEXT NOT NULL,' +
      'category TEXT,' +
      'location TEXT,' +
      'audience TEXT,' +
      'description TEXT,' +
      'notes TEXT,' +
      'allow_rsvp INTEGER NOT NULL DEFAULT 1,' +
      'show_rsvp_names_public INTEGER NOT NULL DEFAULT 1,' +
      'created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
      'updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
      'UNIQUE(date, start_time, title, location)' +
    ')'
  );

  await run("ALTER TABLE events ADD COLUMN allow_rsvp INTEGER NOT NULL DEFAULT 1").catch(() => {});
  await run("ALTER TABLE events ADD COLUMN show_rsvp_names_public INTEGER NOT NULL DEFAULT 1").catch(() => {});

  await run(
    'CREATE TABLE IF NOT EXISTS users (' +
      'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
      'username TEXT NOT NULL UNIQUE,' +
      'password_hash TEXT NOT NULL,' +
      "role TEXT NOT NULL DEFAULT 'admin'," +
      'created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
      'updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP' +
    ')'
  );

  await run(
    'CREATE TABLE IF NOT EXISTS rsvps (' +
      'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
      'event_id INTEGER NOT NULL,' +
      'device_token TEXT NOT NULL,' +
      'quantity INTEGER NOT NULL,' +
      'names_json TEXT,' +
      'created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
      'updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
      'FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,' +
      'UNIQUE(event_id, device_token)' +
    ')'
  );

  await run(
    'CREATE TABLE IF NOT EXISTS prayer_requests (' +
      'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
      'name TEXT,' +
      'request_text TEXT NOT NULL,' +
      "visibility TEXT NOT NULL DEFAULT 'private'," +
      "status TEXT NOT NULL DEFAULT 'pending'," +
      'created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
      'updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP' +
    ')'
  );

  await run(
    'CREATE TABLE IF NOT EXISTS prayer_marks (' +
      'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
      'prayer_request_id INTEGER NOT NULL,' +
      'device_token TEXT NOT NULL,' +
      'created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
      'FOREIGN KEY(prayer_request_id) REFERENCES prayer_requests(id) ON DELETE CASCADE,' +
      'UNIQUE(prayer_request_id, device_token)' +
    ')'
  );

  await run(
    'CREATE TABLE IF NOT EXISTS announcements (' +
      'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
      'title TEXT NOT NULL,' +
      'message TEXT NOT NULL,' +
      "type TEXT NOT NULL DEFAULT 'Normal'," +
      'start_date TEXT,' +
      'end_date TEXT,' +
      'is_active INTEGER NOT NULL DEFAULT 1,' +
      'created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
      'updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP' +
    ')'
  );
}
