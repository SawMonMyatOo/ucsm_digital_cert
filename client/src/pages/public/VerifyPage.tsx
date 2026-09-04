// client/src/pages/public/VerifyPage.tsx
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import type { VerifyResponse } from '../../types';
import { VerificationBadge } from '../../components/VerificationBadge';
import { formatDate, formatDateTime } from '../../utils/format';

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center justify-between border-b border-ink/10 py-2 font-serif text-sm">
      <span>{label}</span>
      <span className={ok ? 'text-emerald-800' : 'text-red-800'} aria-label={ok ? 'pass' : 'fail'}>{ok ? '✓' : '✕'}</span>
    </li>
  );
}

export function VerifyPage() {
  const { certificateId = '' } = useParams();
  const [data, setData] = useState<VerifyResponse | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { api.verify(certificateId).then(setData).finally(() => setLoaded(true)); }, [certificateId]);

  if (!loaded) return <p className="p-10 text-center font-display-sc tracking-widest">Verifying…</p>;
  if (!data) return <p className="p-10 text-center">Verification service unavailable.</p>;
  const c = data.certificate;

  return (
    <main className="paper min-h-screen px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <header className="card border-t-4 border-t-gold p-8 text-center">
          <img src="/assets/ucsm-emblem.png" alt="UCSM emblem" className="mx-auto h-16 w-16" />
          <h1 className="mt-3 font-display text-2xl font-bold text-navy">
            {data.result === 'VALID' ? '✓ Authentic Certificate' : data.result === 'REVOKED' ? '✕ Certificate Revoked' : data.result === 'NOT_FOUND' ? '✕ Certificate Not Found' : '✕ Verification Failed'}
          </h1>
          <p className="font-display-sc text-xs tracking-[0.25em] text-ink/60">UNIVERSITY OF COMPUTER STUDIES, MANDALAY</p>
          <div className="mt-4"><VerificationBadge result={data.result} /></div>
        </header>

        {c && (
          <section className="card mt-6 p-6" aria-label="Certificate details">
            <dl className="grid grid-cols-1 gap-x-8 gap-y-3 font-serif text-sm sm:grid-cols-2">
              {([['Certificate ID', c.certificateId], ['Presented To', c.recipientName], ['Certificate', c.certificateType],
              ['Organization', c.organization], ['Issued', formatDate(c.issuedDate)], ['Signatory', c.signatory.name],
              ['Issued By', c.signatory.organization], ['Verification Date', formatDateTime(data.verifiedAt)]] as const)
                .map(([k, v]) => (
                  <div key={k}><dt className="font-display-sc text-[11px] tracking-widest text-navy/70">{k}</dt><dd className="font-semibold">{v}</dd></div>
                ))}
            </dl>
            <ul className="mt-5">
              <Check ok={data.checks.signature} label={`Digital Signature (${data.signatureMeta.algorithm})`} />
              <Check ok={data.checks.integrity} label="Document Integrity (SHA-256)" />
              <Check ok={data.checks.notRevoked} label="Certificate Status" />
            </ul>
            <p className="mt-4 text-[11px] text-ink/60">Key fingerprint: <code>{data.signatureMeta.fingerprint.slice(0, 32)}…</code></p>
          </section>
        )}

        <p className="mt-6 text-center text-sm">
          <Link className="btn-outline" to={c ? `/certificate/${c.certificateId}` : '/'}>{c ? 'View certificate' : 'Back to home'}</Link>
        </p>
      </div>
    </main>
  );
}