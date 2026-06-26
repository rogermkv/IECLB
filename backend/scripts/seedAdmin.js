import bcrypt from 'bcrypt';
import { initDatabase, get, run, db } from '../src/db.js';

const initialUsers = [
  { username: 'secretaria', password: 'trocar123', role: 'admin' },
  { username: 'admin', password: 'trocar123', role: 'admin' }
];

await initDatabase();

for (const user of initialUsers) {
  const existing = await get('SELECT id FROM users WHERE username = ?', [user.username]);
  if (existing) {
    console.log('Usuário ' + user.username + ' já existe. Nenhuma alteração foi feita.');
    continue;
  }

  const hash = await bcrypt.hash(user.password, 12);
  await run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [user.username, hash, user.role]);
  console.log('Usuário inicial criado: ' + user.username + ' / ' + user.password);
}

db.close();
