import express from 'express';
import { all } from '../db.js';

const router = express.Router();

router.get('/announcements', async (_req, res) => {
  try {
    const announcements = await all(
      "SELECT * FROM announcements WHERE " +
      "is_active = 1 " +
      "AND (start_date IS NULL OR start_date = '' OR start_date <= date('now', 'localtime')) " +
      "AND (end_date IS NULL OR end_date = '' OR end_date >= date('now', 'localtime')) " +
      "ORDER BY CASE type WHEN 'Urgente' THEN 1 WHEN 'Importante' THEN 2 ELSE 3 END ASC, datetime(created_at) DESC, id DESC"
    );
    res.json(announcements);
  } catch {
    res.status(500).json({ message: 'Não foi possível carregar os avisos.' });
  }
});

export default router;
