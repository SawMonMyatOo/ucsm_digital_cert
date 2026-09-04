// server/src/crypto.ts — AES-256-GCM at rest + RSA-4096 RSA-PSS/SHA-256 signing + SHA-256 integrity
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from './env.js';

/* ---------------- AES-256-GCM (authenticated encryption at rest) ---------------- */
export interface EncPayload { v: 1; salt: string; iv: string; tag: string; ct: string }

const kdf = (salt: Buffer): Buffer => crypto.scryptSync(env.ENCRYPTION_KEY, salt, 32);

export function encryptString(plain: string): EncPayload {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', kdf(salt), iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return { v: 1, salt: salt.toString('base64'), iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), ct: ct.toString('base64') };
}

export function decryptString(p: EncPayload): string {
  const decipher = crypto.createDecipheriv('aes-256-gcm', kdf(Buffer.from(p.salt, 'base64')), Buffer.from(p.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(p.tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(p.ct, 'base64')), decipher.final()]).toString('utf8');
}

/* ---------------- RSA-4096 RSA-PSS + SHA-256 (digital signatures) ---------------- */
const PSS_OPTS = { padding: crypto.constants.RSA_PKCS1_PSS_PADDING, saltLength: 32 } as const;
let privateKey: crypto.KeyObject | null = null;
let publicPem = '';
let keyFingerprint = '';

export async function ensureSigningKeys(keysDir: string): Promise<void> {
  await fs.mkdir(keysDir, { recursive: true });
  const privFile = path.join(keysDir, 'signing-private.enc.json');   // encrypted at rest
  const pubFile = path.join(keysDir, 'signing-public.pem');          // public key only
  try {
    const enc = JSON.parse(await fs.readFile(privFile, 'utf8')) as EncPayload;
    const pem = decryptString(enc);
    privateKey = crypto.createPrivateKey(pem);
    publicPem = await fs.readFile(pubFile, 'utf8');
  } catch {
    const pair = crypto.generateKeyPairSync('rsa', { modulusLength: 4096, publicExponent: 65537 });
    const privPem = pair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
    publicPem = pair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
    await fs.writeFile(privFile, JSON.stringify(encryptString(privPem)), 'utf8');
    await fs.writeFile(pubFile, publicPem, 'utf8');
    privateKey = crypto.createPrivateKey(privPem);
  }
  keyFingerprint = crypto.createHash('sha256').update(publicPem).digest('hex');
}

export const signingInfo = (): { algorithm: string; fingerprint: string; publicPem: string } => ({
  algorithm: 'RSA-PSS (RSA-4096) / SHA-256',
  fingerprint: keyFingerprint,
  publicPem
});

export function signString(data: string): string {
  if (!privateKey) throw new Error('Signing key not initialised');
  return crypto.sign('sha256', Buffer.from(data, 'utf8'), { key: privateKey, ...PSS_OPTS }).toString('base64');
}

export function verifyString(data: string, signatureB64: string): boolean {
  try {
    return crypto.verify('sha256', Buffer.from(data, 'utf8'), { key: crypto.createPublicKey(publicPem), ...PSS_OPTS }, Buffer.from(signatureB64, 'base64'));
  } catch { return false; }
}

/* ---------------- Canonicalization + SHA-256 document integrity hash ---------------- */
export function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') return JSON.stringify(value);
  if (t !== 'object') return 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

const IMMUTABLE_FIELDS = ['certificateId', 'recipientName', 'recipientEmail', 'organization',
  'certificateType', 'description', 'issuedDate', 'expiryDate', 'templateId', 'signatory'] as const;

export function documentHashOf(cert: Record<string, unknown>): string {
  const subset: Record<string, unknown> = {};
  for (const k of IMMUTABLE_FIELDS) subset[k] = cert[k] ?? null;
  return crypto.createHash('sha256').update(stableStringify(subset)).digest('hex');
}

export const encryptId = (id: string): string => Buffer.from(JSON.stringify(encryptString(id))).toString('base64url');
export const decryptId = (encryptedId: string): string => decryptString(JSON.parse(Buffer.from(encryptedId, 'base64url').toString('utf8')));
export const randomToken = (bytes = 32): string => crypto.randomBytes(bytes).toString('hex');
