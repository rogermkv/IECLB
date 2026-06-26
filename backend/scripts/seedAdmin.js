import bcrypt from 'bcrypt';
import { initDatabase, get, run, db } from '../src/db.js';

const initialUsers = [
  { username: 'secretaria', displayName: 'Secretaria', password: 'trocar123', role: 'secretaria' },
  { username: 'admin', displayName: 'Administrador', password: 'trocar123', role: 'admin' }
];

await initDatabase();

for (const user of initialUsers) {
  const existing = await get('SELECT id FROM users WHERE username = ?', [user.username]);
  if (existing) {
    await run('UPDATE users SET display_name = COALESCE(NULLIF(display_name, ?), ?), role = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE username = ?', ['', user.displayName, user.role, user.username]);
    console.log('Usuário ' + user.username + ' já existe. Perfil conferido.');
    continue;
  }

  const hash = await bcrypt.hash(user.password, 12);
  await run('INSERT INTO users (username, display_name, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)', [user.username, user.displayName, hash, user.role, 1]);
  console.log('Usuário inicial criado: ' + user.username + ' / ' + user.password);
}

db.close();
