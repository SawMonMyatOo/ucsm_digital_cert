// server/src/certService.ts â€” issue + verify (single source of truth)
import type { JsonDatabaseService } from './db.js';
import { documentHashOf, randomToken, signString, signingInfo, verifyString } from './crypto.js';
import { env } from './env.js';

export interface Signatory { name: string; organization: string }
export interface CertificateRecord {
  id: string; certificateId: string; recipientName: string; recipientEmail: string | null;
  organization: string; certificateType: string; description: string;
  issuedDate: string; expiryDate: string | null; status: 'VALID' | 'REVOKED';
  templateId: string; signatory: Signatory;
  documentHash: string; signature: string;
  signatureMeta: { algorithm: string; fingerprint: string; signedAt: string };
  createdAt: string;
}

export interface SettingsShape {
  orgName: string; verifyBaseUrl: string; sessionTimeoutMinutes: number; nextSerial: number;
  stats: { total: number; valid: number; revoked: number; notFound: number; invalid: number };
}

export const defaultSettings = (verifyBaseUrl: string): SettingsShape => ({
  orgName: 'University of Computer Studies, Mandalay',
  verifyBaseUrl, sessionTimeoutMinutes: 30, nextSerial: 1,
  stats: { total: 0, valid: 0, revoked: 0, notFound: 0, invalid: 0 }
});

export interface IssueInput {
  recipientName: string; recipientEmail?: string; organization: string;
  certificateType: string; description: string; issuedDate: string; expiryDate?: string;
  signatory: Signatory; templateId: string; status?: 'VALID' | 'REVOKED';
}

export async function issueCertificate(db: JsonDatabaseService, input: IssueInput): Promise<CertificateRecord> {
  const settings = await db.readObject<SettingsShape>('settings', defaultSettings(env.VERIFY_BASE_URL));
  const serial = settings.nextSerial;
  settings.nextSerial += 1;
  await db.writeObject('settings', settings);

  const record: CertificateRecord = {
    id: randomToken(16),                                            // opaque internal id
    certificateId: `UCSM-${new Date().getFullYear()}-${String(serial).padStart(6, '0')}`,
    recipientName: input.recipientName,
    recipientEmail: input.recipientEmail ?? null,
    organization: input.organization,
    certificateType: input.certificateType,
    description: input.description,
    issuedDate: input.issuedDate,
    expiryDate: input.expiryDate ?? null,
    status: input.status ?? 'VALID',
    templateId: input.templateId,
    signatory: input.signatory,
    documentHash: '', signature: '',
    signatureMeta: { ...signingInfo(), signedAt: new Date().toISOString() },
    createdAt: new Date().toISOString()
  };
  delete (record.signatureMeta as { publicPem?: string }).publicPem;
  record.documentHash = documentHashOf(record as unknown as Record<string, unknown>);
  record.signature = signString(record.documentHash);               // private key never leaves server
  await db.insert('certificates', record);
  return record;
}

export interface VerifyResult {
  result: 'VALID' | 'INVALID' | 'REVOKED' | 'NOT_FOUND';
  checks: { exists: boolean; notRevoked: boolean; integrity: boolean; signature: boolean };
  certificate: Partial<CertificateRecord> | null;
  signatureMeta: { algorithm: string; fingerprint: string };
  verifiedAt: string;
}

export async function verifyCertificate(db: JsonDatabaseService, certificateId: string): Promise<VerifyResult> {
  const info = signingInfo();
  const cert = await db.findOne<CertificateRecord>('certificates', (c) => c.certificateId === certificateId || c.id === certificateId);
  const verifiedAt = new Date().toISOString();
  if (!cert) {
    await bumpStats(db, 'notFound');
    return { result: 'NOT_FOUND', checks: { exists: false, notRevoked: false, integrity: false, signature: false }, certificate: null, signatureMeta: { algorithm: info.algorithm, fingerprint: info.fingerprint }, verifiedAt };
  }
  const integrity = documentHashOf(cert as unknown as Record<string, unknown>) === cert.documentHash;
  const signature = verifyString(cert.documentHash, cert.signature);
  const notRevoked = cert.status !== 'REVOKED';
  const result: VerifyResult['result'] = !notRevoked ? 'REVOKED' : (integrity && signature ? 'VALID' : 'INVALID');
  await bumpStats(db, result === 'VALID' ? 'valid' : result === 'REVOKED' ? 'revoked' : 'invalid');
  const { signature: _s, ...publicCert } = cert;                    // signature stays server-side for checks
  return {
    result, checks: { exists: true, notRevoked, integrity, signature },
    certificate: publicCert,
    signatureMeta: { algorithm: info.algorithm, fingerprint: info.fingerprint },
    verifiedAt
  };
}

async function bumpStats(db: JsonDatabaseService, key: 'valid' | 'revoked' | 'notFound' | 'invalid' | 'total'): Promise<void> {
  const s = await db.readObject<SettingsShape>('settings', defaultSettings(env.VERIFY_BASE_URL));
  s.stats[key] += 1; s.stats.total += 1;
  await db.writeObject('settings', s);
}
