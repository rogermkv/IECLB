import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { get, run } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/auth/login', async (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  if (!username || !password) return res.status(400).json({ message: 'Informe usuário e senha.' });

  const user = await get('SELECT * FROM users WHERE username = ?', [username]);
  if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ message: 'Usuário ou senha incorretos.' });
  }

  const sessionUser = { id: user.id, username: user.username, display_name: user.display_name || user.username, role: user.role };
  const token = jwt.sign(sessionUser, config.jwtSecret, { expiresIn: '8h' });
  return res.json({ token, user: sessionUser });
});

router.post('/auth/change-password', requireAuth, async (req, res) => {
  const currentPassword = String(req.body.currentPassword || '');
  const newPassword = String(req.body.newPassword || '');

  if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Informe a senha atual e a nova senha.' });
  if (newPassword.length < 6) return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres.' });

  const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!user || !user.is_active || !(await bcrypt.compare(currentPassword, user.password_hash))) {
    return res.status(401).json({ message: 'A senha atual não confere.' });
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hash, req.user.id]);
  return res.json({ message: 'Senha alterada com sucesso.' });
});

export default router;
