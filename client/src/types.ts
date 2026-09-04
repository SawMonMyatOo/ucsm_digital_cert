// client/src/types.ts
export interface Signatory { name: string; organization: string }
export interface Certificate {
  id: string; certificateId: string; recipientName: string; recipientEmail: string | null;
  organization: string; certificateType: string; description: string;
  issuedDate: string; expiryDate: string | null; status: 'VALID' | 'REVOKED';
  templateId: string; signatory: Signatory; documentHash: string;
  signatureMeta: { algorithm: string; keyFingerprint: string; signedAt: string };
  createdAt: string;
  encryptedId?: string;
}
export interface Template {
  id: string; name: string; heading: string; title: string; presentedToText: string;
  bodyTemplate: string[]; emblem: string; signatureImage: string; background: string | null;
  recipientFont: string; recipientSize: number; showQR: boolean; qrPosition: string;
  certIdPosition: string; verificationText: string; signatoryLabel: string;
  issueDateLabel: string; updatedAt: string;
}
export interface VerifyResponse {
  result: 'VALID' | 'INVALID' | 'REVOKED' | 'NOT_FOUND';
  checks: { exists: boolean; notRevoked: boolean; integrity: boolean; signature: boolean };
  certificate: Certificate | null;
  template: Template | null;
  signatureMeta: { algorithm: string; fingerprint: string };
  verifyBaseUrl: string; verifiedAt: string;
  encryptedId?: string;
  storedHash?: string;
  recomputedHash?: string;
  signatureValid?: boolean;
}
export interface AuditEntry { id: string; timestamp: string; action: string; actor: string; certificateId?: string; ip?: string; userAgent?: string }
export interface Settings { orgName: string; verifyBaseUrl: string; sessionTimeoutMinutes: number; nextSerial: number; stats: { total: number; valid: number; revoked: number; notFound: number; invalid: number } }
export interface SecurityStatus {
  signing: { algorithm: string; fingerprint: string; publicPem: string };
  encryption: string; passwordHashing: string;
  sessions: { cookie: string; timeoutMinutes: number };
  headers: string; storage: string;
}