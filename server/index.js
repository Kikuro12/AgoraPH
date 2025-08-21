import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { Server as SocketIOServer } from 'socket.io';
import { pool, ensureSchema } from './lib/db.js';
import authRouter from './routes/auth.js';
import docRouter from './routes/documents.js';
import forumRouter from './routes/forum.js';
import toolsRouter from './routes/tools.js';
import adminRouter from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
  },
});

// Basic security and perf middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('combined'));

// Rate limit
const limiter = rateLimit({ windowMs: 60 * 1000, max: 300 });
app.use(limiter);

// Static files (client build)
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

// API routes
app.use('/api/auth', authRouter);
app.use('/api/documents', docRouter);
app.use('/api/forum', forumRouter);
app.use('/api/tools', toolsRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// Fallback to client index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Socket.io basic chat
io.on('connection', (socket) => {
  socket.on('chat:message', async (payload) => {
    try {
      const { userId, message } = payload || {};
      if (!message || String(message).trim() === '') return;
      const { rows } = await pool.query(
        'INSERT INTO chat_messages(user_id, message) VALUES ($1,$2) RETURNING id, user_id, message, created_at',
        [userId || null, String(message).trim()]
      );
      io.emit('chat:new', rows[0]);
    } catch (e) {
      console.error('chat error', e);
    }
  });
});

const PORT = process.env.PORT || 8080;

await ensureSchema();

server.listen(PORT, () => {
  console.log(`AletheiaDocs server listening on ${PORT}`);
});

