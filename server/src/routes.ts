// server/src/routes.ts
import { Router, json, raw, type Response } from 'express';
import argon2 from 'argon2';
import type { JsonDatabaseService } from './db.js';
import { audit } from './audit.js';
import { documentHashOf, verifyString, signingInfo, encryptId, decryptId } from './crypto.js';
import { generateCertificatePdf } from './renderer.js';
import {
  authLimiter, authMiddleware, cleanStr, csrfGuard, destroySession,
  createSession, lockoutCheck, lockoutClear, lockoutRecord, sanitizeDeep,
  storeUpload, verifyLimiter, type AuthedRequest
} from './security.js';
import {
  defaultSettings, issueCertificate, verifyCertificate,
  type CertificateRecord, type SettingsShape, type VerifyResult
} from './certService.js';
import { seed, type TemplateRecord } from './seed.js';
import { env } from './env.js';

interface UserRow { id: string; username: string; passwordHash: string }
const h = (fn: (req: AuthedRequest, res: Response) => Promise<void>) =>
  async (req: AuthedRequest, res: Response): Promise<void> => {
    try { await fn(req, res); } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

export async function ensureAdmin(db: JsonDatabaseService): Promise<void> {
  const users = await db.readArray<UserRow>('users');
  if (users.length === 0 && env.ADMIN_PASSWORD) {
    await db.insert<UserRow>('users', {
      id: 'admin', username: env.ADMIN_USERNAME,
      passwordHash: await argon2.hash(env.ADMIN_PASSWORD, { type: argon2.argon2id })
    });
  }
  await seed(db);
}

export function buildRoutes(db: JsonDatabaseService, uploadsDir: string): Router {
  const api = Router();
  const auth = authMiddleware(db);
  const csrf = csrfGuard();

  /* ---------- auth ---------- */
  api.post('/auth/login', authLimiter, json({ limit: '10kb' }), h(async (req, res) => {
    const body = sanitizeDeep(req.body ?? {}) as { username?: unknown; password?: unknown };
    const username = cleanStr(body.username, 80);
    const password = typeof body.password === 'string' ? body.password : '';
    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
    if (lockoutCheck(username)) {
      await audit(db, { action: 'LOGIN_BLOCKED_LOCKOUT', actor: username, ...meta });
      res.status(429).json({ error: 'Too many attempts. Account temporarily locked.' });
      return;
    }
    const user = await db.findOne<UserRow>('users', (u) => u.username === username);
    const ok = user ? await argon2.verify(user.passwordHash, password) : false;
    if (!user || !ok) {
      lockoutRecord(username);
      await audit(db, { action: 'LOGIN_FAILED', actor: username, ...meta });
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    lockoutClear(username);
    const session = await createSession(db, user.id, user.username, res);
    await audit(db, { action: 'LOGIN', actor: user.username, ...meta });
    res.json({ username: user.username, csrfToken: session.csrf });
  }));

  api.post('/auth/logout', auth, h(async (req, res) => {
    await audit(db, { action: 'LOGOUT', actor: req.user?.username ?? '?', ip: req.ip, userAgent: req.headers['user-agent'] });
    await destroySession(db, req, res);
    res.json({ ok: true });
  }));

  api.get('/auth/session', auth, (req: AuthedRequest, res: Response) => {
    res.json({ username: req.user?.username, csrfToken: req.user?.csrf });
  });

  /* ---------- public verification (QR target) ---------- */
  api.get('/verify/:certificateId', verifyLimiter, h(async (req, res) => {
    let id = cleanStr(req.params.certificateId, 500);
    // If it looks like an encrypted token, try to decrypt it
    if (!id.startsWith('UCSM-')) {
        try { id = decryptId(id); } catch { /* fall back to raw id */ }
    }
    const result = await verifyCertificate(db, id);
    const settings = await db.readObject<SettingsShape>('settings', defaultSettings(env.VERIFY_BASE_URL));
    const template = await db.findOne<TemplateRecord>('templates',
      (t) => t.id === (result.certificate?.templateId ?? ''));
    const encryptedId = result.certificate?.certificateId ? encryptId(result.certificate.certificateId) : null;
    res.json({ ...result, template, verifyBaseUrl: settings.verifyBaseUrl, encryptedId });
  }));

  api.get('/public/settings', (_req, res) => {
    res.json({ orgName: 'University of Computer Studies, Mandalay', verifyBaseUrl: env.VERIFY_BASE_URL });
  });

  /* ---------- uploads (admin images: backgrounds, signatures, emblems) ---------- */
  api.post('/uploads/image', auth, csrf, raw({ type: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'], limit: '10mb' }), h(async (req, res) => {
    const filename = cleanStr(req.headers['x-filename'] as string, 120) || 'upload.png';
    const url = await storeUpload(uploadsDir, filename, String(req.headers['content-type']), req.body as Buffer);
    await audit(db, { action: 'ASSET_UPLOADED', actor: req.user?.username ?? '?', ip: req.ip, userAgent: req.headers['user-agent'] });
    res.json({ url });
  }));
  api.get('/uploads/:name', (req, res, next) => {
    if (/[^a-z0-9.-]/i.test(req.params.name)) { res.status(400).end(); return; }
    next();
  });

  /* ---------- certificates (admin) ---------- */
  api.get('/certificates', auth, h(async (req, res) => {
    const rows = await db.readArray<CertificateRecord>('certificates');
    const templates = await db.readArray<TemplateRecord>('templates');
    const settings = await db.readObject<SettingsShape>('settings', defaultSettings(env.VERIFY_BASE_URL));
    const q = cleanStr(req.query.q as string, 80).toLowerCase();
    const status = cleanStr(req.query.status as string, 20);
    const type = cleanStr(req.query.type as string, 80);
    const items = rows
      .filter((c) => !q || [c.certificateId, c.recipientName, c.organization].some((v) => v.toLowerCase().includes(q)))
      .filter((c) => !status || c.status === status)
      .filter((c) => !type || c.certificateType === type)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((c) => {
        const encryptedId = encryptId(c.certificateId);
        return {
          ...c,
          encryptedId,
          verifyUrl: `${settings.verifyBaseUrl}/verify/${encryptedId}`
        };
      });
    res.json({ items, templates, settings });
  }));

  api.post('/certificates', auth, csrf, json({ limit: '20kb' }), h(async (req, res) => {
    const b = sanitizeDeep(req.body ?? {}) as Record<string, unknown>;
    const input = {
      recipientName: cleanStr(b.recipientName, 120),
      recipientEmail: cleanStr(b.recipientEmail, 160) || undefined,
      organization: cleanStr(b.organization, 160) || 'University of Computer Studies, Mandalay',
      certificateType: cleanStr(b.certificateType, 120) || 'Certificate of Appreciation',
      description: cleanStr(b.description, 300),
      issuedDate: cleanStr(b.issuedDate, 12),
      expiryDate: cleanStr(b.expiryDate, 12) || undefined,
      templateId: cleanStr(b.templateId, 60),
      signatory: {
        name: cleanStr((b.signatory as { name?: unknown })?.name, 120) || 'Rector',
        organization: cleanStr((b.signatory as { organization?: unknown })?.organization, 160) || 'University of Computer Studies, Mandalay'
      }
    };
    if (!input.recipientName || !input.issuedDate || !input.templateId) {
      res.status(400).json({ error: 'recipientName, issuedDate and templateId are required' });
      return;
    }
    const cert = await issueCertificate(db, input);
    await audit(db, { action: 'CERTIFICATE_CREATED', certificateId: cert.certificateId, actor: req.user?.username ?? '?', ip: req.ip, userAgent: req.headers['user-agent'] });
    res.status(201).json(cert);
  }));

  api.get('/certificates/:id', auth, h(async (req, res) => {
    const cert = await db.findOne<CertificateRecord>('certificates', (c) => c.id === req.params.id || c.certificateId === req.params.id);
    if (!cert) { res.status(404).json({ error: 'Not found' }); return; }
    const template = await db.findOne<TemplateRecord>('templates', (t) => t.id === cert.templateId);
    const encryptedId = encryptId(cert.certificateId);
    res.json({ certificate: { ...cert, encryptedId }, template, encryptedId });
  }));

  api.post('/certificates/:id/revoke', auth, csrf, h(async (req, res) => {
    const updated = await db.update<CertificateRecord>('certificates', req.params.id, (c) => ({ ...c, status: 'REVOKED' }));
    if (!updated) { res.status(404).json({ error: 'Not found' }); return; }
    await audit(db, { action: 'CERTIFICATE_REVOKED', certificateId: updated.certificateId, actor: req.user?.username ?? '?', ip: req.ip, userAgent: req.headers['user-agent'] });
    res.json(updated);
  }));

  api.post('/certificates/:id/validate', auth, h(async (req, res) => {
    const cert = await db.findOne<CertificateRecord>('certificates', (c) => c.id === req.params.id || c.certificateId === req.params.id);
    if (!cert) { res.status(404).json({ error: 'Not found' }); return; }
    const result: VerifyResult = await verifyCertificate(db, cert.certificateId);
    await audit(db, { action: 'CERTIFICATE_VALIDATED', certificateId: cert.certificateId, actor: req.user?.username ?? '?', ip: req.ip, userAgent: req.headers['user-agent'] });
    res.json({ ...result, storedHash: cert.documentHash, recomputedHash: documentHashOf(cert as unknown as Record<string, unknown>), signatureValid: verifyString(cert.documentHash, cert.signature) });
  }));


// ...

  api.get('/certificates/:id/download', auth, h(async (req, res) => {
    const cert = await db.findOne<CertificateRecord>('certificates', (c) => c.id === req.params.id || c.certificateId === req.params.id);
    if (!cert) { res.status(404).json({ error: 'Not found' }); return; }
    
    const template = await db.findOne<TemplateRecord>('templates', (t) => t.id === cert.templateId);
    if (!template) { res.status(404).json({ error: 'Template not found' }); return; }

    await audit(db, { action: 'CERTIFICATE_DOWNLOADED', certificateId: cert.certificateId, actor: req.user?.username ?? '?', ip: req.ip, userAgent: req.headers['user-agent'] });
    
    const pdfBuffer = await generateCertificatePdf(cert, template, uploadsDir);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${cert.certificateId}.pdf"`);
    res.send(pdfBuffer);
  }));


  /* ---------- templates ---------- */
  api.get('/templates', h(async (_req, res) => {
    res.json(await db.readArray<TemplateRecord>('templates'));
  }));

  api.put('/templates/:id', auth, csrf, json({ limit: '50kb' }), h(async (req, res) => {
    const b = sanitizeDeep(req.body ?? {}) as Partial<TemplateRecord>;
    const allowed: (keyof TemplateRecord)[] = ['name', 'heading', 'title', 'presentedToText', 'bodyTemplate', 'emblem', 'signatureImage', 'background', 'recipientFont', 'recipientSize', 'showQR', 'qrPosition', 'certIdPosition', 'verificationText', 'signatoryLabel', 'issueDateLabel'];
    const updated = await db.update<TemplateRecord>('templates', req.params.id, (t) => {
      const next = { ...t };
      for (const k of allowed) if (b[k] !== undefined) (next as Record<string, unknown>)[k] = b[k];
      next.updatedAt = new Date().toISOString();
      return next;
    });
    if (!updated) { res.status(404).json({ error: 'Not found' }); return; }
    await audit(db, { action: 'TEMPLATE_UPDATED', actor: req.user?.username ?? '?', ip: req.ip, userAgent: req.headers['user-agent'] });
    res.json(updated);
  }));

  /* ---------- exports (never leaks secrets) ---------- */
  api.get('/exports/certificates', auth, h(async (req, res) => {
    const rows = await db.readArray<CertificateRecord>('certificates');
    const settings = await db.readObject<SettingsShape>('settings', defaultSettings(env.VERIFY_BASE_URL));
    const status = cleanStr(req.query.status as string, 20);
    const type = cleanStr(req.query.type as string, 80);
    const from = cleanStr(req.query.from as string, 12);
    const to = cleanStr(req.query.to as string, 12);
    const q = cleanStr(req.query.q as string, 80).toLowerCase();
    const items = rows
      .filter((c) => !status || c.status === status)
      .filter((c) => !type || c.certificateType === type)
      .filter((c) => !from || c.issuedDate >= from)
      .filter((c) => !to || c.issuedDate <= to)
      .filter((c) => !q || c.recipientName.toLowerCase().includes(q) || c.organization.toLowerCase().includes(q))
      .map((c) => {
        const encryptedToken = encryptId(c.certificateId);
        return {
          certificateId: c.certificateId,
          recipientName: c.recipientName,
          organization: c.organization,
          certificateType: c.certificateType,
          issuedDate: c.issuedDate,
          status: c.status,
          signatory: c.signatory.name,
          encryptedId: encryptedToken,
          verificationLink: `${settings.verifyBaseUrl}/verify/${encryptedToken}`
        };
      });
    await audit(db, { action: 'EXPORT', actor: req.user?.username ?? '?', ip: req.ip, userAgent: req.headers['user-agent'] });
    const format = req.query.format === 'csv' ? 'csv' : 'json';
    if (format === 'csv') {
      const head = 'certificateId,recipientName,organization,certificateType,issuedDate,status,signatory,verificationLink';
      const esc = (v: string): string => `"${String(v).replace(/"/g, '""')}"`;
      const body = items.map((r) => [r.certificateId, r.recipientName, r.organization, r.certificateType, r.issuedDate, r.status, r.signatory, r.verificationLink].map(esc).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="ucsm-certificates.csv"');
      res.send(`${head}\n${body}`);
      return;
    }
    res.setHeader('Content-Disposition', 'attachment; filename="ucsm-certificates.json"');
    res.json(items);
  }));

  /* ---------- audit / settings / security ---------- */
  api.get('/audit', auth, h(async (_req, res) => {
    const rows = await db.readArray<import('./audit.js').AuditEntry>('audit-log');
    res.json(rows.slice(-200).reverse());
  }));

  api.get('/settings', auth, h(async (_req, res) => {
    res.json(await db.readObject<SettingsShape>('settings', defaultSettings(env.VERIFY_BASE_URL)));
  }));

  api.put('/settings', auth, csrf, json({ limit: '10kb' }), h(async (req, res) => {
    const b = sanitizeDeep(req.body ?? {}) as Partial<SettingsShape>;
    const current = await db.readObject<SettingsShape>('settings', defaultSettings(env.VERIFY_BASE_URL));
    const next: SettingsShape = {
      ...current,
      orgName: cleanStr(b.orgName, 160) || current.orgName,
      verifyBaseUrl: cleanStr(b.verifyBaseUrl, 120) || current.verifyBaseUrl,
      sessionTimeoutMinutes: Math.min(240, Math.max(5, Number(b.sessionTimeoutMinutes) || 30))
    };
    await db.writeObject('settings', next);
    await audit(db, { action: 'SETTINGS_CHANGED', actor: req.user?.username ?? '?', ip: req.ip, userAgent: req.headers['user-agent'] });
    res.json(next);
  }));

  api.get('/security/status', auth, (_req, res) => {
    res.json({
      signing: signingInfo(),
      encryption: 'AES-256-GCM (scrypt KDF) — private key encrypted at rest',
      passwordHashing: 'Argon2id',
      sessions: { cookie: 'HttpOnly · SameSite=Strict · Secure in production', timeoutMinutes: 30 },
      headers: 'Helmet CSP · restricted CORS · rate limiting',
      storage: 'JSON database service with atomic writes'
    });
  });

  return api;
}