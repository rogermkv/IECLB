import bcrypt from 'bcrypt';
import { initDatabase, get, run, db } from '../src/db.js';

await initDatabase();
const username = 'secretaria';
const password = 'trocar123';
const existing = await get('SELECT id FROM users WHERE username = ?', [username]);

if (existing) {
  console.log('Usuário secretaria já existe. Nenhuma alteração foi feita.');
} else {
  const hash = await bcrypt.hash(password, 12);
  await run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [username, hash, 'admin']);
  console.log('Usuário inicial criado: secretaria / trocar123');
}

db.close();
