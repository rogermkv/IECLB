import express from 'express';
import { all, get, run } from '../db.js';

const router = express.Router();

function clean(value) {
  return String(value || '').trim();
}

function parseNames(names, quantity) {
  const input = Array.isArray(names) ? names : [];
  return Array.from({ length: quantity }, (_, index) => clean(input[index]));
}

function validateRsvpPayload(payload) {
  const quantity = Number(payload.quantity);
  const errors = [];
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) errors.push('Informe uma quantidade entre 1 e 10 pessoas.');
  return { quantity, names: errors.length ? [] : parseNames(payload.names, quantity), errors };
}

async function eventAllowsRsvp(eventId) {
  const event = await get('SELECT id, allow_rsvp, show_rsvp_names_public FROM events WHERE id = ?', [eventId]);
  if (!event) return { error: 'Evento não encontrado.', status: 404 };
  if (!event.allow_rsvp) return { error: 'Este evento não permite confirmação de presença.', status: 400, event };
  return { event };
}

async function rsvpSummary(eventId, deviceToken) {
  const total = await get('SELECT COALESCE(SUM(quantity), 0) AS total_confirmed FROM rsvps WHERE event_id = ?', [eventId]);
  const mine = deviceToken ? await get('SELECT id, quantity, names_json FROM rsvps WHERE event_id = ? AND device_token = ?', [eventId, deviceToken]) : null;
  return {
    total_confirmed: total.total_confirmed || 0,
    already_confirmed: Boolean(mine),
    my_rsvp: mine ? { id: mine.id, quantity: mine.quantity, names: JSON.parse(mine.names_json || '[]') } : null
  };
}

function buildFilters(query) {
  const where = [];
  const params = [];

  if (query.month) {
    where.push("strftime('%Y-%m', date) = ?");
    params.push(query.month);
  }
  if (query.category) {
    where.push('category = ?');
    params.push(query.category);
  }
  if (query.location) {
    where.push('location = ?');
    params.push(query.location);
  }
  if (query.search) {
    where.push('(title LIKE ? OR description LIKE ? OR notes LIKE ? OR audience LIKE ?)');
    const term = '%' + query.search + '%';
    params.push(term, term, term, term);
  }

  return { clause: where.length ? 'WHERE ' + where.join(' AND ') : '', params };
}

router.get('/events', async (req, res) => {
  try {
    const filters = buildFilters(req.query);
    const events = await all('SELECT * FROM events ' + filters.clause + ' ORDER BY date ASC, start_time ASC, title ASC', filters.params);
    res.json(events);
  } catch {
    res.status(500).json({ message: 'Não foi possível carregar os eventos.' });
  }
});

router.get('/events/:id', async (req, res) => {
  try {
    const event = await get('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (!event) return res.status(404).json({ message: 'Evento não encontrado.' });
    return res.json(event);
  } catch {
    return res.status(500).json({ message: 'Não foi possível carregar o evento.' });
  }
});



router.get('/events/:id/rsvp-summary', async (req, res) => {
  try {
    const event = await get('SELECT id, allow_rsvp, show_rsvp_names_public FROM events WHERE id = ?', [req.params.id]);
    if (!event) return res.status(404).json({ message: 'Evento não encontrado.' });
    const summary = await rsvpSummary(req.params.id, clean(req.query.device_token));
    res.json({ ...summary, allow_rsvp: Boolean(event.allow_rsvp), show_rsvp_names_public: Boolean(event.show_rsvp_names_public) });
  } catch {
    res.status(500).json({ message: 'Não foi possível carregar as confirmações.' });
  }
});

router.get('/events/:id/rsvps-public', async (req, res) => {
  try {
    const event = await get('SELECT id, show_rsvp_names_public FROM events WHERE id = ?', [req.params.id]);
    if (!event) return res.status(404).json({ message: 'Evento não encontrado.' });
    if (!event.show_rsvp_names_public) return res.json([]);
    const rows = await all('SELECT quantity, names_json FROM rsvps WHERE event_id = ? ORDER BY datetime(created_at) ASC, id ASC', [req.params.id]);
    const names = rows.flatMap((row) => {
      const parsed = JSON.parse(row.names_json || '[]');
      return Array.from({ length: row.quantity }, (_, index) => clean(parsed[index]) || 'Participante');
    });
    res.json(names);
  } catch {
    res.status(500).json({ message: 'Não foi possível carregar os participantes.' });
  }
});

router.post('/events/:id/rsvp', async (req, res) => {
  try {
    const deviceToken = clean(req.body.device_token);
    if (!deviceToken) return res.status(400).json({ message: 'Não foi possível identificar este dispositivo.' });
    const allowed = await eventAllowsRsvp(req.params.id);
    if (allowed.error) return res.status(allowed.status).json({ message: allowed.error });
    const { quantity, names, errors } = validateRsvpPayload(req.body);
    if (errors.length) return res.status(400).json({ message: errors.join(' ') });
    await run('INSERT INTO rsvps (event_id, device_token, quantity, names_json) VALUES (?, ?, ?, ?)', [req.params.id, deviceToken, quantity, JSON.stringify(names)]);
    res.status(201).json({ message: 'Presença confirmada com sucesso.', ...(await rsvpSummary(req.params.id, deviceToken)) });
  } catch (error) {
    if (String(error.message || '').includes('UNIQUE')) return res.status(409).json({ message: 'Você já confirmou presença neste evento.' });
    res.status(500).json({ message: 'Não foi possível confirmar presença.' });
  }
});

router.put('/events/:id/rsvp', async (req, res) => {
  try {
    const deviceToken = clean(req.body.device_token);
    if (!deviceToken) return res.status(400).json({ message: 'Não foi possível identificar este dispositivo.' });
    const allowed = await eventAllowsRsvp(req.params.id);
    if (allowed.error) return res.status(allowed.status).json({ message: allowed.error });
    const { quantity, names, errors } = validateRsvpPayload(req.body);
    if (errors.length) return res.status(400).json({ message: errors.join(' ') });
    const result = await run('UPDATE rsvps SET quantity = ?, names_json = ?, updated_at = CURRENT_TIMESTAMP WHERE event_id = ? AND device_token = ?', [quantity, JSON.stringify(names), req.params.id, deviceToken]);
    if (!result.changes) return res.status(404).json({ message: 'Confirmação não encontrada.' });
    res.json({ message: 'Presença atualizada com sucesso.', ...(await rsvpSummary(req.params.id, deviceToken)) });
  } catch {
    res.status(500).json({ message: 'Não foi possível atualizar a confirmação.' });
  }
});

router.delete('/events/:id/rsvp', async (req, res) => {
  try {
    const deviceToken = clean(req.body.device_token || req.query.device_token);
    if (!deviceToken) return res.status(400).json({ message: 'Não foi possível identificar este dispositivo.' });
    await run('DELETE FROM rsvps WHERE event_id = ? AND device_token = ?', [req.params.id, deviceToken]);
    res.json({ message: 'Confirmação cancelada com sucesso.', ...(await rsvpSummary(req.params.id, deviceToken)) });
  } catch {
    res.status(500).json({ message: 'Não foi possível cancelar a confirmação.' });
  }
});

router.get('/categories', async (_req, res) => {
  const rows = await all("SELECT DISTINCT category FROM events WHERE category IS NOT NULL AND category <> '' ORDER BY category");
  res.json(rows.map((row) => row.category));
});

router.get('/locations', async (_req, res) => {
  const rows = await all("SELECT DISTINCT location FROM events WHERE location IS NOT NULL AND location <> '' ORDER BY location");
  res.json(rows.map((row) => row.location));
});

export default router;
