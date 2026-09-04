// client/src/pages/admin/Templates.tsx — editor + live preview + asset upload
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { Certificate, Template } from '../../types';
import { ScaledCertificate } from '../../components/CertificateRenderer';

const SAMPLE: Certificate = {
  id: 'sample', certificateId: 'UCSM-2026-000000', recipientName: 'Saw Mon Myat Oo', recipientEmail: null,
  organization: 'University of Computer Studies, Mandalay', certificateType: 'Certificate of Appreciation',
  description: 'UCSM AI Hackathon 2026', issuedDate: '2026-08-27', expiryDate: null, status: 'VALID',
  templateId: '', signatory: { name: 'Rector', organization: 'University of Computer Studies, Mandalay' },
  documentHash: '', signatureMeta: { algorithm: '', keyFingerprint: '', signedAt: '' }, createdAt: ''
};

export function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [current, setCurrent] = useState<Template | null>(null);
  const [saved, setSaved] = useState('');

  useEffect(() => { api.templates().then((t) => { setTemplates(t); setCurrent(t[0] ?? null); }).catch(() => undefined); }, []);

  const set = <K extends keyof Template>(k: K, v: Template[K]): void => setCurrent((c) => (c ? { ...c, [k]: v } : c));

  const upload = (k: 'emblem' | 'signatureImage' | 'background') => async (e: { target: { files: FileList | null } }): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await api.uploadImage(file);
    set(k, url as Template[typeof k]);
  };

  const save = async (): Promise<void> => {
    if (!current) return;
    const updated = await api.saveTemplate(current.id, current);
    setCurrent(updated);
    setTemplates((t) => t.map((x) => (x.id === updated.id ? updated : x)));
    setSaved('Template saved');
    setTimeout(() => setSaved(''), 2000);
  };

  const create = async (): Promise<void> => {
    const t = await api.createTemplate();
    setTemplates((prev) => [...prev, t]);
    setCurrent(t);
    setSaved('New template created — give it a name, then Save');
    setTimeout(() => setSaved(''), 3000);
  };

  const remove = async (): Promise<void> => {
    if (!current) return;
    if (!window.confirm(`Delete template "${current.name}"?\nThis cannot be undone.`)) return;
    await api.deleteTemplate(current.id);
    const next = templates.filter((t) => t.id !== current.id);
    setTemplates(next);
    setCurrent(next[0] ?? null);
    setSaved('Template deleted');
    setTimeout(() => setSaved(''), 2000);
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[380px_1fr]">
      <section className="card h-fit p-6">
        <h2 className="font-display text-lg font-bold text-navy">Template Editor</h2>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="min-w-[160px] flex-1">
            <label className="label" htmlFor="t">Template</label>
            <select id="t" className="input" value={current?.id ?? ''} onChange={(e) => setCurrent(templates.find((t) => t.id === e.target.value) ?? null)}>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-outline whitespace-nowrap px-2 py-1 text-xs" onClick={() => void create()}>New</button>
            <button type="button" className="btn-danger whitespace-nowrap px-2 py-1 text-xs" disabled={!current} onClick={() => void remove()}>Delete</button>
          </div>
        </div>
        {current && (
          <div className="mt-4 grid gap-3">
            <div><label className="label" htmlFor="n">Name</label><input id="n" className="input" value={current.name} onChange={(e) => set('name', e.target.value)} /></div>
            <div><label className="label" htmlFor="h">Heading</label><input id="h" className="input" value={current.heading} onChange={(e) => set('heading', e.target.value)} /></div>
            <div><label className="label" htmlFor="ti">Title</label><input id="ti" className="input" value={current.title} onChange={(e) => set('title', e.target.value)} /></div>
            <label className="label" htmlFor="b">{`Body lines ({{recipientName}}, {{description}} supported)`}</label>
            <textarea id="b" className="input" rows={4} value={current.bodyTemplate.join('\n')} onChange={(e) => set('bodyTemplate', e.target.value.split('\n'))}></textarea>
            <div><label className="label" htmlFor="s">Recipient name size</label>
                <input id="s" type="number" min={36} max={96} className="input" value={current.recipientSize} onChange={(e) => set('recipientSize', Number(e.target.value))} /></div>
            <div><label className="label" htmlFor="v">Verification text</label><input id="v" className="input" value={current.verificationText} onChange={(e) => set('verificationText', e.target.value)} /></div>
            <div className="space-y-3 rounded border border-gold/30 bg-ivory/50 p-3 text-xs">
              <div>
                <p className="font-semibold text-navy">Certificate Assets & Images</p>
                <p className="mt-1 text-ink/70">
                  These are the images displayed on the certificate. Use <span className="font-semibold text-ink">Upload</span> to choose a file from your computer, or type the file location if the image is already stored in the system.
                </p>
              </div>
              {([
                ['background', 'Background image', 'the main design printed behind the certificate text'],
                ['signatureImage', 'Signature image', 'the scanned signature shown at the bottom'],
                ['emblem', 'Emblem / logo', 'the university emblem shown at the top']
              ] as const).map(([k, label, hint]) => (
                <div key={k} className="space-y-1">
                  <label className="label">{label}</label>
                  <p className="text-[10px] leading-snug text-ink/55">{hint}</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input text-xs"
                      value={current[k] ?? ''}
                      placeholder="Paste the image location, or click Upload"
                      onChange={(e) => set(k, e.target.value as Template[typeof k])}
                    />
                    <label className="btn-outline cursor-pointer whitespace-nowrap px-2 py-1 text-xs">
                      Upload
                      <input
                        type="file"
                        className="hidden"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={(e) => { void upload(k)(e); }}
                      />
                    </label>
                  </div>
                  {current[k] && (
                    <div className="mt-1 flex items-center gap-2">
                      <img src={current[k]!} alt={label} className="h-7 w-auto max-w-[80px] rounded border border-ink/20 object-contain bg-white" />
                      <span className="truncate text-[10px] text-ink/60">{current[k]}</span>
                      <button
                        type="button"
                        title={`Remove ${label.toLowerCase()}`}
                        className="ml-auto shrink-0 rounded border border-red-800/40 px-1.5 py-0.5 text-[10px] text-red-800 hover:bg-red-800 hover:text-white"
                        onClick={() => set(k, '')}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={current.showQR} onChange={(e) => set('showQR', e.target.checked)} /> Show QR code</label>
            <button type="button" className="btn-gold justify-center" onClick={() => void save()}>Save Template</button>
            {saved && <p className="text-sm text-emerald-800">{saved}</p>}
          </div>
        )}
      </section>
      <section aria-label="Template preview">
        <h2 className="mb-3 font-display-sc text-sm tracking-widest text-navy">PREVIEW</h2>
        {current && <div className="shadow-cert"><ScaledCertificate certificate={SAMPLE} template={current} verifyUrl="https://verify.ucsmsc.org/verify/UCSM-2026-000001" /></div>}
      </section>
    </div>
  );
}