// client/src/pages/admin/CertificateDetail.tsx
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import type { Certificate, VerifyResponse } from '../../types';
import { formatDate, formatDateTime } from '../../utils/format';

export function CertificateDetail() {
  const { id = '' } = useParams();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [check, setCheck] = useState<VerifyResponse | null>(null);

  useEffect(() => {
    api.certificate(id).then((r) => setCert(r.certificate)).catch(() => undefined);
    api.validate(id).then(setCheck).catch(() => undefined);
  }, [id]);

  if (!cert) return <p className="font-display-sc tracking-widest">Loading…</p>;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card p-6">
        <h2 className="font-display text-lg font-bold text-navy">{cert.certificateId}</h2>
        <p className="font-display-sc text-xs tracking-widest text-ink/60">{cert.status}</p>
        <dl className="mt-4 grid grid-cols-1 gap-3 font-serif text-sm sm:grid-cols-2">
          {([['Recipient', cert.recipientName], ['Type', cert.certificateType], ['Organization', cert.organization],
          ['Issued', formatDate(cert.issuedDate)], ['Signatory', cert.signatory.name], ['Template', cert.templateId],
          ['Signed At', formatDateTime(cert.signatureMeta.signedAt)], ['Algorithm', cert.signatureMeta.algorithm]] as const)
            .map(([k, v]) => <div key={k}><dt className="font-display-sc text-[11px] tracking-widest text-navy/70">{k}</dt><dd>{v}</dd></div>)}
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link className="btn-outline" to={`/certificate/${cert.encryptedId || cert.certificateId}`}>Open / Download</Link>
          <button type="button" className="btn-gold" onClick={() => void navigator.clipboard.writeText(`${window.location.origin}/verify/${cert.encryptedId || cert.certificateId}`)}>Copy Verification Link</button>
          {cert.status === 'VALID' && (
            <button type="button" className="btn-danger" onClick={() => { if (window.confirm('Revoke?')) void api.revoke(cert.id).then(() => setCert({ ...cert, status: 'REVOKED' })); }}>Revoke</button>
          )}
        </div>
      </section>
      <section className="card p-6">
        <h3 className="font-display-sc text-sm tracking-widest text-navy">CRYPTOGRAPHIC VALIDATION</h3>
        {check ? (
          <ul className="mt-3 font-serif text-sm">
            <li>Signature: <b className={check.checks.signature ? 'text-emerald-800' : 'text-red-800'}>{check.checks.signature ? 'VALID' : 'INVALID'}</b></li>
            <li>Integrity hash: <b className={check.checks.integrity ? 'text-emerald-800' : 'text-red-800'}>{check.checks.integrity ? 'MATCH' : 'MISMATCH'}</b></li>
            <li className="mt-2 break-all text-[11px] text-ink/60">stored: {check.storedHash}</li>
            <li className="break-all text-[11px] text-ink/60">computed: {check.recomputedHash}</li>
          </ul>
        ) : <p className="mt-3 text-sm text-ink/60">Running…</p>}
      </section>
    </div>
  );
}