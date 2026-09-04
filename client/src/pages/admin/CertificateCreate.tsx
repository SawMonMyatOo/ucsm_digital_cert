// client/src/pages/admin/CertificateCreate.tsx — form + live preview
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import type { Certificate, Template } from '../../types';
import { ScaledCertificate } from '../../components/CertificateRenderer';

const blank = {
  recipientName: '', recipientEmail: '', organization: 'University of Computer Studies, Mandalay',
  certificateType: 'Certificate of Appreciation', description: 'UCSM AI Hackathon 2026',
  issuedDate: new Date().toISOString().slice(0, 10), expiryDate: '', signatoryName: 'Rector',
  signatoryOrganization: 'University of Computer Studies, Mandalay', templateId: ''
};

export function CertificateCreate() {
  const [form, setForm] = useState(blank);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => { api.templates().then((t) => { setTemplates(t); setForm((f) => ({ ...f, templateId: f.templateId || t[0]?.id || '' })); }).catch(() => undefined); }, []);

  const template = templates.find((t) => t.id === form.templateId) ?? templates[0];
  const draft: Certificate = {
    id: 'draft', certificateId: 'UCSM-2026-######', recipientName: form.recipientName || '{{recipientName}}',
    recipientEmail: form.recipientEmail || null, organization: form.organization, certificateType: form.certificateType,
    description: form.description, issuedDate: form.issuedDate, expiryDate: form.expiryDate || null,
    status: 'VALID', templateId: form.templateId,
    signatory: { name: form.signatoryName, organization: form.signatoryOrganization },
    documentHash: '', signatureMeta: { algorithm: '', keyFingerprint: '', signedAt: '' }, createdAt: ''
  };

  const set = (k: keyof typeof blank) => (e: { target: { value: string } }): void => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (): Promise<void> => {
    setError('');
    try {
      const cert = await api.createCertificate({
        recipientName: form.recipientName, recipientEmail: form.recipientEmail || undefined,
        organization: form.organization, certificateType: form.certificateType, description: form.description,
        issuedDate: form.issuedDate, expiryDate: form.expiryDate || undefined, templateId: form.templateId,
        signatory: { name: form.signatoryName, organization: form.signatoryOrganization }
      });
      navigate(`/admin/certificates/${cert.id}`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[380px_1fr]">
      <section className="card h-fit p-6">
        <h2 className="font-display text-lg font-bold text-navy">Issue Certificate</h2>
        {error && <p role="alert" className="mt-2 text-sm text-red-800">{error}</p>}
        <div className="mt-4 grid gap-3">
          <div><label className="label" htmlFor="rn">Recipient Name *</label><input id="rn" className="input" value={form.recipientName} onChange={set('recipientName')} /></div>
          <div><label className="label" htmlFor="re">Recipient Email (optional)</label><input id="re" type="email" className="input" value={form.recipientEmail} onChange={set('recipientEmail')} /></div>
          <div><label className="label" htmlFor="org">Organization</label><input id="org" className="input" value={form.organization} onChange={set('organization')} /></div>
          <div><label className="label" htmlFor="ct">Certificate Type</label><input id="ct" className="input" value={form.certificateType} onChange={set('certificateType')} /></div>
          <div><label className="label" htmlFor="de">Description / Event</label><input id="de" className="input" value={form.description} onChange={set('description')} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="id">Issue Date *</label><input id="id" type="date" className="input" value={form.issuedDate} onChange={set('issuedDate')} /></div>
            <div><label className="label" htmlFor="ed">Expiry (optional)</label><input id="ed" type="date" className="input" value={form.expiryDate} onChange={set('expiryDate')} /></div>
          </div>
          <div><label className="label" htmlFor="sn">Signatory Name</label><input id="sn" className="input" value={form.signatoryName} onChange={set('signatoryName')} /></div>
          <div><label className="label" htmlFor="so">Signatory Organization</label><input id="so" className="input" value={form.signatoryOrganization} onChange={set('signatoryName') && set('signatoryOrganization')} /></div>
          <div><label className="label" htmlFor="tp">Template</label>
            <select id="tp" className="input" value={form.templateId} onChange={set('templateId')}>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <button type="button" className="btn-gold mt-5 w-full justify-center" onClick={() => void submit()}>Sign & Issue</button>
        <p className="mt-3 text-[11px] text-ink/60">Certificate ID and RSA-PSS signature are generated server-side.</p>
      </section>

      <section aria-label="Live preview">
        <h2 className="mb-3 font-display-sc text-sm tracking-widest text-navy">LIVE PREVIEW</h2>
        {template && <div className="shadow-cert"><ScaledCertificate certificate={draft} template={template} verifyUrl={`https://verify.ucsmsc.org/verify/UCSM-2026-######`} /></div>}
      </section>
    </div>
  );
}