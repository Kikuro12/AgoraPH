import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { pool } from '../lib/db.js';
import { authMiddleware } from './auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({ storage });

router.get('/', async (req, res) => {
  const { q, category } = req.query;
  const clauses = [];
  const params = [];
  if (q) { params.push(`%${q}%`); clauses.push(`(title ILIKE $${params.length} OR description ILIKE $${params.length})`); }
  if (category) { params.push(category); clauses.push(`category = $${params.length}`); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const { rows } = await pool.query(`SELECT * FROM documents ${where} ORDER BY created_at DESC`, params);
  res.json(rows);
});

router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { title, category, description } = req.body;
    if (!req.file || !title || !category) return res.status(400).json({ error: 'Missing fields' });
    const { rows } = await pool.query(
      'INSERT INTO documents(title, category, description, file_path, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [title, category, description || '', req.file.filename, req.user.sub]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Upload failed' });
  }
});

router.get('/:id/download', async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT * FROM documents WHERE id=$1', [id]);
  const doc = rows[0];
  if (!doc) return res.status(404).json({ error: 'Not found' });
  const filePath = path.join(uploadsDir, doc.file_path);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing' });
  res.download(filePath, `${doc.title}.pdf`);
});

router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query('DELETE FROM documents WHERE id=$1 RETURNING *', [id]);
  const doc = rows[0];
  if (doc) {
    const filePath = path.join(uploadsDir, doc.file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  res.json({ ok: true });
});

export default router;

