import express from 'express';
import bcrypt from 'bcrypt';
import { all, get, run } from '../db.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { validateEventPayload } from '../utils/events.js';

const router = express.Router();
router.use('/admin', requireAuth);

const prayerVisibilityValues = ['private', 'public_requested'];
const prayerStatusValues = ['pending', 'public', 'private', 'archived'];

function validatePrayerRequestPayload(payload) {
  const request = {
    name: clean(payload.name),
    request_text: clean(payload.request_text),
    visibility: prayerVisibilityValues.includes(payload.visibility) ? payload.visibility : 'private',
    status: prayerStatusValues.includes(payload.status) ? payload.status : 'pending'
  };
  const errors = [];
  if (!request.request_text) errors.push('Informe o pedido de oração.');
  return { request, errors };
}

const announcementTypes = ['Normal', 'Importante', 'Urgente'];

function clean(value) {
  return String(value || '').trim();
}

function cleanDate(value) {
  const raw = clean(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : '';
}

function parseRsvpNames(names, quantity) {
  const input = Array.isArray(names) ? names : [];
  return Array.from({ length: quantity }, (_, index) => clean(input[index]));
}

function validateAdminRsvpPayload(payload) {
  const quantity = Number(payload.quantity);
  const errors = [];
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) errors.push('Informe uma quantidade entre 1 e 10 pessoas.');
  return { quantity, names: errors.length ? [] : parseRsvpNames(payload.names, quantity), errors };
}

function csvEscape(value) {
  const text = String(value ?? '');
  return '"' + text.replace(/"/g, '""') + '"';
}

function validateAnnouncementPayload(payload) {
  const announcement = {
    title: clean(payload.title),
    message: clean(payload.message),
    type: announcementTypes.includes(payload.type) ? payload.type : 'Normal',
    start_date: cleanDate(payload.start_date),
    end_date: cleanDate(payload.end_date),
    is_active: payload.is_active === false || payload.is_active === 0 || payload.is_active === '0' ? 0 : 1
  };

  const errors = [];
  if (!announcement.title) errors.push('Informe o título do aviso.');
  if (!announcement.message) errors.push('Informe a mensagem do aviso.');
  if (announcement.start_date && announcement.end_date && announcement.end_date < announcement.start_date) {
    errors.push('A data limite não pode ser anterior à data inicial.');
  }

  return { announcement, errors };
}


const userRoles = ['admin', 'secretaria'];

function normalizeUserPayload(payload, requirePassword = false) {
  const user = {
    username: clean(payload.username).toLowerCase(),
    display_name: clean(payload.display_name),
    role: userRoles.includes(payload.role) ? payload.role : 'secretaria',
    is_active: payload.is_active === false || payload.is_active === 0 || payload.is_active === '0' ? 0 : 1,
    password: String(payload.password || '')
  };
  if (!user.display_name) user.display_name = user.username;

  const errors = [];
  if (!user.username) errors.push('Informe o usuário.');
  if (user.username && user.username.length < 3) errors.push('O usuário deve ter pelo menos 3 caracteres.');
  if (requirePassword && user.password.length < 6) errors.push('A senha deve ter pelo menos 6 caracteres.');
  return { user, errors };
}

async function activeAdminCount(exceptUserId = null) {
  const params = [];
  let where = "WHERE role = 'admin' AND is_active = 1";
  if (exceptUserId) {
    where += ' AND id != ?';
    params.push(exceptUserId);
  }
  const row = await get('SELECT COUNT(*) AS total FROM users ' + where, params);
  return Number(row?.total || 0);
}

router.get('/admin/users', requireAdmin, async (_req, res) => {
  const users = await all('SELECT id, username, display_name, role, is_active, created_at, updated_at FROM users ORDER BY username ASC');
  res.json(users);
});

router.post('/admin/users', requireAdmin, async (req, res) => {
  const { user, errors } = normalizeUserPayload(req.body, true);
  if (errors.length) return res.status(400).json({ message: errors.join(' ') });

  try {
    const hash = await bcrypt.hash(user.password, 12);
    const result = await run(
      'INSERT INTO users (username, display_name, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)',
      [user.username, user.display_name, hash, user.role, user.is_active]
    );
    const created = await get('SELECT id, username, display_name, role, is_active, created_at, updated_at FROM users WHERE id = ?', [result.id]);
    res.status(201).json(created);
  } catch {
    res.status(409).json({ message: 'Já existe um usuário com este login.' });
  }
});

router.put('/admin/users/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const current = await get('SELECT id, role, is_active FROM users WHERE id = ?', [id]);
  if (!current) return res.status(404).json({ message: 'Usuário não encontrado.' });

  const { user, errors } = normalizeUserPayload(req.body, false);
  if (errors.length) return res.status(400).json({ message: errors.join(' ') });

  const wouldRemoveActiveAdmin = current.role === 'admin' && current.is_active && (user.role !== 'admin' || !user.is_active);
  if (wouldRemoveActiveAdmin && (await activeAdminCount(id)) < 1) {
    return res.status(400).json({ message: 'Não é possível deixar o sistema sem um administrador ativo.' });
  }

  try {
    const result = await run(
      'UPDATE users SET username = ?, display_name = ?, role = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [user.username, user.display_name, user.role, user.is_active, id]
    );
    if (!result.changes) return res.status(404).json({ message: 'Usuário não encontrado.' });
    const updated = await get('SELECT id, username, display_name, role, is_active, created_at, updated_at FROM users WHERE id = ?', [id]);
    res.json(updated);
  } catch {
    res.status(409).json({ message: 'Já existe um usuário com este login.' });
  }
});

router.put('/admin/users/:id/password', requireAdmin, async (req, res) => {
  const password = String(req.body.password || '');
  if (!password || password.length < 6) return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres.' });

  const hash = await bcrypt.hash(password, 12);
  const result = await run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hash, req.params.id]);
  if (!result.changes) return res.status(404).json({ message: 'Usuário não encontrado.' });
  res.json({ message: 'Senha redefinida com sucesso.' });
});

router.delete('/admin/users/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (id === Number(req.user.id)) return res.status(400).json({ message: 'Você não pode excluir o usuário que está usando agora.' });

  const user = await get('SELECT id, role, is_active FROM users WHERE id = ?', [id]);
  if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
  if (user.role === 'admin' && user.is_active && (await activeAdminCount(id)) < 1) {
    return res.status(400).json({ message: 'Não é possível excluir o único administrador ativo.' });
  }

  const result = await run('DELETE FROM users WHERE id = ?', [id]);
  if (!result.changes) return res.status(404).json({ message: 'Usuário não encontrado.' });
  res.json({ message: 'Usuário excluído com sucesso.' });
});

router.get('/admin/events', async (req, res) => {
  const search = String(req.query.search || '').trim();
  const params = [];
  let where = '';
  if (search) {
    where = 'WHERE title LIKE ? OR category LIKE ? OR location LIKE ? OR audience LIKE ?';
    params.push('%' + search + '%', '%' + search + '%', '%' + search + '%', '%' + search + '%');
  }
  const events = await all('SELECT * FROM events ' + where + ' ORDER BY date DESC, start_time ASC', params);
  res.json(events);
});

router.post('/admin/events', async (req, res) => {
  const { event, errors } = validateEventPayload(req.body);
  if (errors.length) return res.status(400).json({ message: errors.join(' ') });

  try {
    const result = await run(
      'INSERT INTO events (date, start_time, end_time, title, category, location, audience, description, notes, allow_rsvp, show_rsvp_names_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [event.date, event.start_time, event.end_time, event.title, event.category, event.location, event.audience, event.description, event.notes, event.allow_rsvp, event.show_rsvp_names_public]
    );
    const created = await get('SELECT * FROM events WHERE id = ?', [result.id]);
    return res.status(201).json(created);
  } catch {
    return res.status(409).json({ message: 'Já existe um evento semelhante nesta data, horário e local.' });
  }
});

router.put('/admin/events/:id', async (req, res) => {
  const { event, errors } = validateEventPayload(req.body);
  if (errors.length) return res.status(400).json({ message: errors.join(' ') });

  try {
    const result = await run(
      'UPDATE events SET date = ?, start_time = ?, end_time = ?, title = ?, category = ?, location = ?, audience = ?, description = ?, notes = ?, allow_rsvp = ?, show_rsvp_names_public = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [event.date, event.start_time, event.end_time, event.title, event.category, event.location, event.audience, event.description, event.notes, event.allow_rsvp, event.show_rsvp_names_public, req.params.id]
    );
    if (!result.changes) return res.status(404).json({ message: 'Evento não encontrado.' });
    const updated = await get('SELECT * FROM events WHERE id = ?', [req.params.id]);
    return res.json(updated);
  } catch {
    return res.status(409).json({ message: 'Já existe um evento semelhante nesta data, horário e local.' });
  }
});

router.delete('/admin/events/:id', async (req, res) => {
  const result = await run('DELETE FROM events WHERE id = ?', [req.params.id]);
  if (!result.changes) return res.status(404).json({ message: 'Evento não encontrado.' });
  return res.json({ message: 'Evento excluído com sucesso.' });
});


router.get('/admin/announcements', async (_req, res) => {
  try {
    const announcements = await all(
      "SELECT * FROM announcements ORDER BY " +
      "CASE type WHEN 'Urgente' THEN 1 WHEN 'Importante' THEN 2 ELSE 3 END ASC, " +
      "datetime(created_at) DESC, id DESC"
    );
    res.json(announcements);
  } catch {
    res.status(500).json({ message: 'Não foi possível carregar os avisos.' });
  }
});

router.post('/admin/announcements', async (req, res) => {
  const { announcement, errors } = validateAnnouncementPayload(req.body);
  if (errors.length) return res.status(400).json({ message: errors.join(' ') });

  try {
    const result = await run(
      'INSERT INTO announcements (title, message, type, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [announcement.title, announcement.message, announcement.type, announcement.start_date, announcement.end_date, announcement.is_active]
    );
    const created = await get('SELECT * FROM announcements WHERE id = ?', [result.id]);
    return res.status(201).json(created);
  } catch {
    return res.status(500).json({ message: 'Não foi possível cadastrar o aviso.' });
  }
});

router.put('/admin/announcements/:id', async (req, res) => {
  const { announcement, errors } = validateAnnouncementPayload(req.body);
  if (errors.length) return res.status(400).json({ message: errors.join(' ') });

  try {
    const result = await run(
      'UPDATE announcements SET title = ?, message = ?, type = ?, start_date = ?, end_date = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [announcement.title, announcement.message, announcement.type, announcement.start_date, announcement.end_date, announcement.is_active, req.params.id]
    );
    if (!result.changes) return res.status(404).json({ message: 'Aviso não encontrado.' });
    const updated = await get('SELECT * FROM announcements WHERE id = ?', [req.params.id]);
    return res.json(updated);
  } catch {
    return res.status(500).json({ message: 'Não foi possível atualizar o aviso.' });
  }
});

router.delete('/admin/announcements/:id', async (req, res) => {
  const result = await run('DELETE FROM announcements WHERE id = ?', [req.params.id]);
  if (!result.changes) return res.status(404).json({ message: 'Aviso não encontrado.' });
  return res.json({ message: 'Aviso excluído com sucesso.' });
});


router.get('/admin/events/:id/rsvps', async (req, res) => {
  try {
    const rows = await all('SELECT * FROM rsvps WHERE event_id = ? ORDER BY datetime(created_at) ASC, id ASC', [req.params.id]);
    res.json(rows.map((row) => ({ ...row, names: JSON.parse(row.names_json || '[]') })));
  } catch {
    res.status(500).json({ message: 'Não foi possível carregar as confirmações.' });
  }
});

router.put('/admin/rsvps/:id', async (req, res) => {
  const { quantity, names, errors } = validateAdminRsvpPayload(req.body);
  if (errors.length) return res.status(400).json({ message: errors.join(' ') });
  try {
    const result = await run('UPDATE rsvps SET quantity = ?, names_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [quantity, JSON.stringify(names), req.params.id]);
    if (!result.changes) return res.status(404).json({ message: 'Confirmação não encontrada.' });
    const updated = await get('SELECT * FROM rsvps WHERE id = ?', [req.params.id]);
    res.json({ ...updated, names: JSON.parse(updated.names_json || '[]') });
  } catch {
    res.status(500).json({ message: 'Não foi possível atualizar a confirmação.' });
  }
});

router.delete('/admin/rsvps/:id', async (req, res) => {
  try {
    const result = await run('DELETE FROM rsvps WHERE id = ?', [req.params.id]);
    if (!result.changes) return res.status(404).json({ message: 'Confirmação não encontrada.' });
    res.json({ message: 'Confirmação excluída com sucesso.' });
  } catch {
    res.status(500).json({ message: 'Não foi possível excluir a confirmação.' });
  }
});

router.get('/admin/events/:id/rsvps/export', async (req, res) => {
  try {
    const event = await get('SELECT title FROM events WHERE id = ?', [req.params.id]);
    if (!event) return res.status(404).json({ message: 'Evento não encontrado.' });
    const rows = await all('SELECT quantity, names_json, created_at, updated_at FROM rsvps WHERE event_id = ? ORDER BY datetime(created_at) ASC, id ASC', [req.params.id]);
    const lines = [['Evento', 'Quantidade', 'Nomes', 'Criado em', 'Atualizado em'].map(csvEscape).join(',')];
    for (const row of rows) {
      const names = JSON.parse(row.names_json || '[]').map((name) => clean(name) || 'Participante').join('; ');
      lines.push([event.title, row.quantity, names, row.created_at, row.updated_at].map(csvEscape).join(','));
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="confirmacoes-evento-' + req.params.id + '.csv"');
    res.send('\ufeff' + lines.join('\n'));
  } catch {
    res.status(500).json({ message: 'Não foi possível exportar as confirmações.' });
  }
});


router.get('/admin/prayer-requests', async (req, res) => {
  try {
    const status = clean(req.query.status);
    const params = [];
    let where = '';
    if (status) {
      where = 'WHERE pr.status = ?';
      params.push(status);
    }
    const rows = await all(
      "SELECT pr.*, COUNT(pm.id) AS prayer_count " +
      "FROM prayer_requests pr " +
      "LEFT JOIN prayer_marks pm ON pm.prayer_request_id = pr.id " +
      where + ' ' +
      "GROUP BY pr.id " +
      "ORDER BY datetime(pr.created_at) DESC, pr.id DESC",
      params
    );
    res.json(rows);
  } catch {
    res.status(500).json({ message: 'Não foi possível carregar os pedidos de oração.' });
  }
});

router.get('/admin/prayer-requests/:id', async (req, res) => {
  try {
    const request = await get(
      "SELECT pr.*, COUNT(pm.id) AS prayer_count " +
      "FROM prayer_requests pr LEFT JOIN prayer_marks pm ON pm.prayer_request_id = pr.id " +
      "WHERE pr.id = ? GROUP BY pr.id",
      [req.params.id]
    );
    if (!request) return res.status(404).json({ message: 'Pedido não encontrado.' });
    res.json(request);
  } catch {
    res.status(500).json({ message: 'Não foi possível carregar o pedido.' });
  }
});

router.put('/admin/prayer-requests/:id', async (req, res) => {
  const { request, errors } = validatePrayerRequestPayload(req.body);
  if (errors.length) return res.status(400).json({ message: errors.join(' ') });
  try {
    const result = await run(
      'UPDATE prayer_requests SET name = ?, request_text = ?, visibility = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [request.name, request.request_text, request.visibility, request.status, req.params.id]
    );
    if (!result.changes) return res.status(404).json({ message: 'Pedido não encontrado.' });
    const updated = await get('SELECT * FROM prayer_requests WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Não foi possível atualizar o pedido.' });
  }
});

router.put('/admin/prayer-requests/:id/status', async (req, res) => {
  const status = prayerStatusValues.includes(req.body.status) ? req.body.status : '';
  if (!status) return res.status(400).json({ message: 'Status inválido.' });
  try {
    const visibility = status === 'private' ? 'private' : null;
    const result = visibility
      ? await run('UPDATE prayer_requests SET status = ?, visibility = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, visibility, req.params.id])
      : await run('UPDATE prayer_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, req.params.id]);
    if (!result.changes) return res.status(404).json({ message: 'Pedido não encontrado.' });
    res.json({ message: 'Status atualizado com sucesso.' });
  } catch {
    res.status(500).json({ message: 'Não foi possível atualizar o status.' });
  }
});

router.delete('/admin/prayer-requests/:id', async (req, res) => {
  try {
    const result = await run('DELETE FROM prayer_requests WHERE id = ?', [req.params.id]);
    if (!result.changes) return res.status(404).json({ message: 'Pedido não encontrado.' });
    res.json({ message: 'Pedido excluído com sucesso.' });
  } catch {
    res.status(500).json({ message: 'Não foi possível excluir o pedido.' });
  }
});

export default router;
