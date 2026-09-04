// server/src/index.ts
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'node:fs';
import { env } from './env.js';
import { JsonDatabaseService } from './db.js';
import { ensureSigningKeys } from './crypto.js';
import { apiLimiter } from './security.js';
import { buildRoutes, ensureAdmin } from './routes.js';

const app = express();
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'"],
      'object-src': ["'none'"], 'base-uri': ["'none'"], 'frame-ancestors': ["'self'"],
      'form-action': ["'self'"]
    }
  }
}));
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(apiLimiter);
app.disable('x-powered-by');

const db = new JsonDatabaseService(path.join(env.DATA_DIR));
const uploadsDir = path.join(env.DATA_DIR, 'uploads');

app.use('/api/uploads', express.static(uploadsDir, {
  setHeaders: (res) => res.setHeader('Cache-Control', 'public, max-age=86400')
}));
app.use('/api', buildRoutes(db, uploadsDir));

// Serve built client in production
const dist = path.resolve(process.cwd(), '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(dist, 'index.html'));
  });
}

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

async function main(): Promise<void> {
  await ensureSigningKeys(path.join(env.DATA_DIR, 'keys'));   // RSA-4096, encrypted at rest
  await ensureAdmin(db);                                     // Argon2id admin + seed data
  app.listen(env.PORT, () => console.log(`UCSM cert API on :${env.PORT}`));
}
void main();