// server/src/seed.ts — template + sample certificate (reference data only; name is dynamic in template)
import type { JsonDatabaseService } from './db.js';
import { issueCertificate } from './certService.js';

export interface TemplateRecord {
  id: string; name: string; heading: string; title: string; presentedToText: string;
  bodyTemplate: string[]; emblem: string; signatureImage: string; background: string | null;
  recipientFont: string; recipientSize: number; showQR: boolean; qrPosition: string;
  certIdPosition: string; verificationText: string; signatoryLabel: string;
  issueDateLabel: string; updatedAt: string;
}

export const defaultTemplate = (): TemplateRecord => ({
  id: 'ucsmaihackathon2026',
  name: 'UCSM AI Hackathon 2026 — Appreciation',
  heading: 'UNIVERSITY OF COMPUTER STUDIES, MANDALAY',
  title: 'CERTIFICATE OF APPRECIATION',
  presentedToText: 'THIS CERTIFICATE IS PROUDLY PRESENTED TO',
  // {{recipientName}} and {{description}} are interpolated at render time — never baked in.
  bodyTemplate: [
    'In recogration of your active participation and valuable contribution to the',
    '{{description}}',
    'and for demostrating the spirit of innovation, creativity, and teamwork.'
  ],
  emblem: '/assets/ucsm_logo.png',
  signatureImage: '/assets/rector-signature.png',
  background: '/assets/bg_only.png',
  recipientFont: 'script', recipientSize: 64, showQR: true, qrPosition: 'bottom-right',
  certIdPosition: 'bottom-left',
  verificationText: 'Digitally Verified',
  signatoryLabel: 'Rector', issueDateLabel: 'Date of issue',
  updatedAt: new Date().toISOString()
});

export async function seed(db: JsonDatabaseService): Promise<void> {
  const templates = await db.readArray<TemplateRecord>('templates');
  if (templates.length === 0) await db.insert('templates', defaultTemplate());
  const certs = await db.readArray<{ certificateId: string }>('certificates');
  if (certs.length === 0) {
    await issueCertificate(db, {
      recipientName: 'Saw Mon Myat Oo',                    // sample data only
      organization: 'University of Computer Studies, Mandalay',
      certificateType: 'Certificate of Appreciation',
      description: 'UCSM AI Hackathon 2026',
      issuedDate: '2026-08-27',
      signatory: { name: 'Rector', organization: 'University of Computer Studies, Mandalay' },
      templateId: 'ucsmaihackathon2026'
    });
  }
}