// client/src/pages/public/CertificatePage.tsx
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import type { VerifyResponse } from '../../types';
import { CertificateRenderer, ScaledCertificate } from '../../components/CertificateRenderer';
import { ShareButtons } from '../../components/ShareButtons';
import { VerificationBadge } from '../../components/VerificationBadge';
import { downloadPDF, downloadPNG } from '../../utils/download';

export function CertificatePage() {
  const { certificateId = '' } = useParams();
  const [data, setData] = useState<VerifyResponse | null>(null);
  const [loaded, setLoaded] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => { api.verify(certificateId).then(setData).finally(() => setLoaded(true)); }, [certificateId]);

  if (!loaded) return <p className="p-10 text-center font-display-sc tracking-widest">Loading certificate…</p>;
  if (!data?.certificate || !data.template) {
    return <p className="p-10 text-center font-display-sc tracking-widest text-red-800">✕ Certificate not found — <Link className="underline" to="/">verify another</Link></p>;
  }
  const verifyToken = data.encryptedId || data.certificate.encryptedId || data.certificate.certificateId;
  const verifyUrl = `${data.verifyBaseUrl}/verify/${verifyToken}`;

  return (
    <main className="paper min-h-screen px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <VerificationBadge result={data.result} />
          <Link to={`/verify/${verifyToken}`} className="btn-outline">Verification details</Link>
        </header>

        <div className="shadow-cert overflow-hidden">
          {/* hidden full-size node used for pixel-perfect PDF/PNG export */}
          <div style={{ position: 'fixed', left: -2000, top: 0, pointerEvents: 'none' }} aria-hidden="true">
            <div ref={captureRef}><CertificateRenderer certificate={data.certificate} template={data.template} verifyUrl={verifyUrl} /></div>
          </div>
          <ScaledCertificate certificate={data.certificate} template={data.template} verifyUrl={verifyUrl} />
        </div>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="card p-5">
            <h2 className="font-display-sc text-sm tracking-widest text-navy">Download</h2>
            <div className="mt-3 flex gap-2">
              <button type="button" className="btn-gold" onClick={() => { if (captureRef.current) void downloadPDF(captureRef.current, data.certificate!.certificateId); }}>Download PDF</button>
              <button type="button" className="btn-outline" onClick={() => { if (captureRef.current) void downloadPNG(captureRef.current, data.certificate!.certificateId); }}>Download PNG</button>
            </div>
          </div>
          <div className="card p-5">
            <h2 className="font-display-sc text-sm tracking-widest text-navy">Share</h2>
            <div className="mt-3"><ShareButtons verifyUrl={verifyUrl} title={`${data.certificate.certificateType} — ${data.certificate.recipientName}`} /></div>
          </div>
        </section>
      </div>
    </main>
  );
}