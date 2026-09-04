// server/src/security.ts — sessions, CSRF, brute-force protection, sanitizers, uploads
import type { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { JsonDatabaseService } from './db.js';
import { randomToken } from './crypto.js';
import { env } from './env.js';

export interface SessionRow { id: string; userId: string; username: string; csrf: string; expiresAt: number }
export interface AuthedRequest extends Request { user?: { userId: string; username: string; csrf: string } }

const COOKIE = 'ucsm_session';
export const sessionTimeoutMs = (): number => 30 * 60 * 1000;

export async function createSession(db: JsonDatabaseService, userId: string, username: string, res: Response): Promise<SessionRow> {
  const row: SessionRow = { id: randomToken(), userId, username, csrf: randomToken(24), expiresAt: Date.now() + sessionTimeoutMs() };
  await db.insert('sessions', row);
  res.cookie(COOKIE, row.id, {
    httpOnly: true, sameSite: 'strict', secure: env.production,
    maxAge: sessionTimeoutMs(), path: '/'
  });
  return row;
}

export async function destroySession(db: JsonDatabaseService, req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[COOKIE] as string | undefined;
  if (token) {
    const sessions = await db.readArray<SessionRow>('sessions');
    await db.writeArray('sessions', sessions.filter((s) => s.id !== token));
  }
  res.clearCookie(COOKIE, { path: '/' });
}

export function authMiddleware(db: JsonDatabaseService) {
  return async (req: AuthedRequest, res: Response, next: NextFunction): Promise<void> => {
    const token = req.cookies?.[COOKIE] as string | undefined;
    if (!token) { res.status(401).json({ error: 'Unauthenticated' }); return; }
    const session = await db.findOne<SessionRow>('sessions', (s) => s.id === token);
    if (!session || session.expiresAt < Date.now()) {
      res.clearCookie(COOKIE, { path: '/' });
      res.status(401).json({ error: 'Session expired' });
      return;
    }
    session.expiresAt = Date.now() + sessionTimeoutMs();            // sliding timeout
    void db.update<SessionRow>('sessions', session.id, () => session);
    req.user = { userId: session.userId, username: session.username, csrf: session.csrf };
    next();
  };
}

/** CSRF: double-submit token bound to the HTTP-only session cookie. */
export function csrfGuard() {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) { next(); return; }
    const header = req.headers['x-csrf-token'];
    if (!req.user || header !== req.user.csrf) { res.status(403).json({ error: 'CSRF token invalid' }); return; }
    next();
  };
}

/* ---------------- Brute-force / rate limiting ---------------- */
const failures = new Map<string, { count: number; until: number }>();
export function lockoutCheck(username: string): boolean {
  const f = failures.get(username);
  return !!f && f.until > Date.now();
}
export function lockoutRecord(username: string): void {
  const f = failures.get(username) ?? { count: 0, until: 0 };
  f.count += 1;
  if (f.count >= 5) { f.until = Date.now() + 15 * 60 * 1000; f.count = 0; }   // 15-min lockout
  failures.set(username, f);
}
export function lockoutClear(username: string): void { failures.delete(username); }

export const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false });
export const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
export const verifyLimiter = rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });

/* ---------------- Input sanitizing (prototype pollution protection) ---------------- */
const BANNED = new Set(['__proto__', 'constructor', 'prototype']);
export function sanitizeDeep<T>(value: T): T {
  if (Array.isArray(value)) return value.map((v) => sanitizeDeep(v)) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (BANNED.has(k)) continue;
      out[k] = sanitizeDeep(v);
    }
    return out as T;
  }
  return value;
}

export const cleanStr = (v: unknown, max = 500): string =>
  typeof v === 'string' ? v.trim().replace(/[<>\u0000]/g, '').slice(0, max) : '';

/* ---------------- File uploads (MIME + extension + size + traversal checks) ---------------- */
const ALLOWED: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp' };

export async function storeUpload(dir: string, filename: string, mime: string, body: Buffer): Promise<string> {
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename);
  if (base !== filename || base.includes('..')) throw new Error('Invalid filename');
  if (ALLOWED[ext] !== mime) throw new Error('File type not allowed');
  if (body.length > 1024 * 1024) throw new Error('File too large (max 1 MB)');
  const name = `${crypto.randomUUID()}${ext}`;
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), body);
  return `/api/uploads/${name}`;
}