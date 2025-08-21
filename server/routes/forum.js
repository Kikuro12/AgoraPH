import express from 'express';
import { pool } from '../lib/db.js';
import { authMiddleware } from './auth.js';

const router = express.Router();

router.get('/posts', async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT p.id, p.title, p.content, p.created_at,
           u.display_name as author
    FROM forum_posts p
    LEFT JOIN users u ON u.id = p.user_id
    ORDER BY p.created_at DESC`);
  res.json(rows);
});

router.get('/posts/:id', async (req, res) => {
  const { id } = req.params;
  const postRes = await pool.query(`
    SELECT p.id, p.title, p.content, p.created_at, u.display_name as author
    FROM forum_posts p LEFT JOIN users u ON u.id=p.user_id
    WHERE p.id=$1`, [id]);
  const post = postRes.rows[0];
  if (!post) return res.status(404).json({ error: 'Not found' });
  const repliesRes = await pool.query(`
    SELECT r.id, r.content, r.created_at, u.display_name as author
    FROM forum_replies r LEFT JOIN users u ON u.id=r.user_id
    WHERE r.post_id=$1 ORDER BY r.created_at ASC`, [id]);
  res.json({ post, replies: repliesRes.rows });
});

router.post('/posts', authMiddleware, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Missing fields' });
  const { rows } = await pool.query(`
    INSERT INTO forum_posts(user_id, title, content)
    VALUES ($1,$2,$3) RETURNING id, title, content, created_at`, [req.user.sub, title, content]);
  res.json(rows[0]);
});

router.post('/posts/:id/replies', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Missing content' });
  const { rows } = await pool.query(`
    INSERT INTO forum_replies(post_id, user_id, content)
    VALUES ($1,$2,$3) RETURNING id, content, created_at`, [id, req.user.sub, content]);
  res.json(rows[0]);
});

router.delete('/posts/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  if (req.user.role === 'admin') {
    await pool.query('DELETE FROM forum_posts WHERE id=$1', [id]);
  } else {
    await pool.query('DELETE FROM forum_posts WHERE id=$1 AND user_id=$2', [id, req.user.sub]);
  }
  res.json({ ok: true });
});

export default router;

