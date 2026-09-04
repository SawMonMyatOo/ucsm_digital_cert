// client/src/pages/admin/Validation.tsx
import { useState } from 'react';
import { api } from '../../services/api';
import type { VerifyResponse } from '../../types';

export function Validation() {
  const [id, setId] = useState('');
  const [result, setResult] = useState<(VerifyResponse & { storedHash?: string; signatureValid?: boolean }) | null>(null);

  const run = async (): Promise<void> => { setResult(await api.validate(id.trim()).catch(() => api.verify(id.trim()))); };

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-lg font-bold text-navy">Certificate Validation</h2>
      <div className="mt-4 flex gap-2">
        <input className="input" aria-label="Certificate ID" placeholder="UCSM-2026-000001" value={id} onChange={(e) => setId(e.target.value)} />
        <button type="button" className="btn-gold" onClick={() => void run()}>Validate</button>
      </div>
      {result && (
        <section className="card mt-6 p-6 font-serif text-sm">
          <p className="font-display text-base font-bold">Result: {result.result}</p>
          <ul className="mt-3 space-y-1">
            <li>Signature: {result.checks.signature ? '✓ valid' : '✕ invalid'}</li>
            <li>Integrity hash: {result.checks.integrity ? '✓ match' : '✕ mismatch'}</li>
            <li>Status: {result.checks.notRevoked ? '✓ not revoked' : '✕ revoked'}</li>
            {result.certificate && (<>
              <li>Recipient: {result.certificate.recipientName}</li>
              <li>Issued: {result.certificate.issuedDate}</li>
              <li>Template: {result.certificate.templateId}</li>
              <li>Signatory: {result.certificate.signatory.name}</li>
            </>)}
            {'storedHash' in result && <li className="break-all text-[11px] text-ink/60">SHA-256: {result.storedHash}</li>}
          </ul>
        </section>
      )}
    </div>
  );
}