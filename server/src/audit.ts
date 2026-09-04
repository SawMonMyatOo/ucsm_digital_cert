// server/src/audit.ts
import type { JsonDatabaseService } from './db.js';
import { randomToken } from './crypto.js';

export interface AuditEntry {
  id: string; timestamp: string; action: string; actor: string;
  certificateId?: string; ip?: string; userAgent?: string;
}

export async function audit(db: JsonDatabaseService, entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<void> {
  const rows = await db.readArray<AuditEntry>('audit-log');
  rows.push({ ...entry, id: randomToken(8), timestamp: new Date().toISOString() });
  await db.writeArray('audit-log', rows.slice(-2000));   // bounded log
}