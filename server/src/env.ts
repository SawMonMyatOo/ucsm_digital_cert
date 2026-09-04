// server/src/env.ts
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const required = (v: string | undefined, name: string): string => {
  if (!v) throw new Error(`Missing environment variable ${name} (see .env.example)`);
  return v;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 4000),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  VERIFY_BASE_URL: process.env.VERIFY_BASE_URL ?? 'http://localhost:5173',
  ADMIN_USERNAME: process.env.ADMIN_USERNAME ?? 'admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  SESSION_SECRET: required(process.env.SESSION_SECRET, 'SESSION_SECRET'),
  SIGNING_KEY_PASSPHRASE: required(process.env.SIGNING_KEY_PASSPHRASE, 'SIGNING_KEY_PASSPHRASE'),
  ENCRYPTION_KEY: required(process.env.ENCRYPTION_KEY, 'ENCRYPTION_KEY'),
  DATA_DIR: path.resolve(process.cwd(), '..', 'data'),
  get production(): boolean { return this.NODE_ENV === 'production'; }
};