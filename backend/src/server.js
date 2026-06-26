import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { initDatabase } from './db.js';
import eventsRouter from './routes/events.js';
import announcementsRouter from './routes/announcements.js';
import prayerRequestsRouter from './routes/prayerRequests.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const frontendDist = path.join(projectRoot, 'frontend', 'dist');

const app = express();

const allowedOrigins = new Set([
  config.frontendUrl,
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173'
]);

function isAllowedOrigin(origin) {
  if (!origin || allowedOrigins.has(origin)) return true;
  try {
    const url = new URL(origin);
    const isLocalNetwork = /^(10\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.)/.test(url.hostname);
    const isDevPort = ['5173', '4173'].includes(url.port);
    return isLocalNetwork && isDevPort;
  } catch {
    return false;
  }
}

app.use(cors({
  origin(origin, callback) {
    callback(null, isAllowedOrigin(origin));
  },
  credentials: true
}));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', eventsRouter);
app.use('/api', announcementsRouter);
app.use('/api', prayerRequestsRouter);
app.use('/api', authRouter);
app.use('/api', adminRouter);

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use((_req, res) => res.status(404).json({ message: 'Rota não encontrada.' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Ocorreu um erro inesperado.' });
});

await initDatabase();
app.listen(config.port, () => console.log('Backend da Agenda IECLB rodando em http://localhost:' + config.port));
