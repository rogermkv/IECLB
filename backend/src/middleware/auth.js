import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { get } from '../db.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Acesso restrito. Faça login novamente.' });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await get('SELECT id, username, display_name, role, is_active FROM users WHERE id = ?', [payload.id]);
    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Usuário inativo ou não encontrado. Faça login novamente.' });
    }
    req.user = { id: user.id, username: user.username, display_name: user.display_name || user.username, role: user.role };
    return next();
  } catch {
    return res.status(401).json({ message: 'Sessão inválida ou expirada. Faça login novamente.' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso permitido apenas para administradores.' });
  }
  return next();
}
