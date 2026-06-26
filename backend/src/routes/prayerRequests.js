import express from 'express';
import { all, get, run } from '../db.js';

const router = express.Router();
const visibilityValues = ['private', 'public_requested'];

function clean(value) {
  return String(value || '').trim();
}

function publicRequestRow(row) {
  return {
    id: row.id,
    name: row.name || '',
    request_text: row.request_text,
    created_at: row.created_at,
    prayer_count: row.prayer_count || 0
  };
}

router.post('/prayer-requests', async (req, res) => {
  const name = clean(req.body.name);
  const requestText = clean(req.body.request_text);
  const visibility = visibilityValues.includes(req.body.visibility) ? req.body.visibility : 'private';

  if (!requestText) return res.status(400).json({ message: 'Informe o pedido de oração.' });

  try {
    const status = visibility === 'private' ? 'private' : 'pending';
    const result = await run(
      'INSERT INTO prayer_requests (name, request_text, visibility, status) VALUES (?, ?, ?, ?)',
      [name, requestText, visibility, status]
    );
    res.status(201).json({ id: result.id, message: 'Seu pedido foi enviado com sucesso.' });
  } catch (error) {
    console.error('Erro ao salvar pedido de oração:', error);
    res.status(500).json({ message: 'Não foi possível enviar o pedido de oração.' });
  }
});

router.get('/prayer-requests/public', async (_req, res) => {
  try {
    const rows = await all(
      "SELECT pr.*, COUNT(pm.id) AS prayer_count " +
      "FROM prayer_requests pr " +
      "LEFT JOIN prayer_marks pm ON pm.prayer_request_id = pr.id " +
      "WHERE pr.status = 'public' " +
      "GROUP BY pr.id " +
      "ORDER BY datetime(pr.created_at) DESC, pr.id DESC"
    );
    res.json(rows.map(publicRequestRow));
  } catch (error) {
    console.error('Erro ao carregar pedidos públicos de oração:', error);
    res.status(500).json({ message: 'Não foi possível carregar os pedidos de oração.' });
  }
});

router.get('/prayer-requests/:id/pray-status', async (req, res) => {
  const deviceToken = clean(req.query.device_token);
  if (!deviceToken) return res.json({ has_prayed: false, prayer_count: 0 });

  try {
    const request = await get("SELECT id FROM prayer_requests WHERE id = ? AND status = 'public'", [req.params.id]);
    if (!request) return res.status(404).json({ message: 'Pedido não encontrado.' });
    const mark = await get('SELECT id FROM prayer_marks WHERE prayer_request_id = ? AND device_token = ?', [req.params.id, deviceToken]);
    const total = await get('SELECT COUNT(*) AS prayer_count FROM prayer_marks WHERE prayer_request_id = ?', [req.params.id]);
    res.json({ has_prayed: Boolean(mark), prayer_count: total.prayer_count || 0 });
  } catch {
    res.status(500).json({ message: 'Não foi possível verificar este pedido.' });
  }
});

router.post('/prayer-requests/:id/pray', async (req, res) => {
  const deviceToken = clean(req.body.device_token);
  if (!deviceToken) return res.status(400).json({ message: 'Não foi possível identificar este dispositivo.' });

  try {
    const request = await get("SELECT id FROM prayer_requests WHERE id = ? AND status = 'public'", [req.params.id]);
    if (!request) return res.status(404).json({ message: 'Pedido não encontrado.' });
    await run('INSERT OR IGNORE INTO prayer_marks (prayer_request_id, device_token) VALUES (?, ?)', [req.params.id, deviceToken]);
    const total = await get('SELECT COUNT(*) AS prayer_count FROM prayer_marks WHERE prayer_request_id = ?', [req.params.id]);
    res.json({ has_prayed: true, prayer_count: total.prayer_count || 0, message: 'Obrigado por dedicar um momento de oração.' });
  } catch {
    res.status(500).json({ message: 'Não foi possível registrar sua oração.' });
  }
});

export default router;
