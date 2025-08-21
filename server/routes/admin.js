import express from 'express';
import { pool } from '../lib/db.js';
import { authMiddleware } from './auth.js';

const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
}

router.get('/announcements', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
  res.json(rows);
});

router.post('/announcements', authMiddleware, requireAdmin, async (req, res) => {
  const { text, icon } = req.body;
  if (!text) return res.status(400).json({ error: 'Missing text' });
  const { rows } = await pool.query('INSERT INTO announcements(text, icon) VALUES ($1,$2) RETURNING *', [text, icon || null]);
  res.json(rows[0]);
});

router.delete('/announcements/:id', authMiddleware, requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM announcements WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

export default router;

// Chat moderation
router.get('/chat', authMiddleware, requireAdmin, async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 200');
  res.json(rows);
});

router.delete('/chat/:id', authMiddleware, requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM chat_messages WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

