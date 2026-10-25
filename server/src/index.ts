import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { one } from './db';
import authRoutes from './routes/auth';
import salesRoutes from './routes/sales';
import adminRoutes from './routes/admin';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/admin', adminRoutes);

// Central error handler: maps RAISE EXCEPTION codes from stored procedures to HTTP status codes
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const map: Record<string, number> = { EMAIL_EXISTS: 409, DUPLICATE_FILE: 409, INVALID_FILE_NAME: 400, EMPTY_FILE: 400 };
  if (map[err.message]) return res.status(map[err.message]).json({ error: err.message });
  if (/^2[23]/.test(err.code ?? '')) return res.status(400).json({ error: 'INVALID_DATA', detail: err.message });
  console.error(err);
  res.status(500).json({ error: 'INTERNAL_ERROR' });
});

async function seedAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (ADMIN_EMAIL && ADMIN_PASSWORD)
    await one('sp_seed_admin', ['Admin', ADMIN_EMAIL, await bcrypt.hash(ADMIN_PASSWORD, 10)]);
}

const port = Number(process.env.PORT || 4000);
seedAdmin()
  .then(() => app.listen(port, () => console.log(`API running on :${port}`)))
  .catch((e) => { console.error('Startup failed', e); process.exit(1); });
