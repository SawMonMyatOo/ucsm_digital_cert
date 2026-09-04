// client/src/pages/admin/Exports.tsx
import { useState } from 'react';
import { api } from '../../services/api';

export function Exports() {
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [q, setQ] = useState('');

  const href = api.exportsUrl(new URLSearchParams({ format, status, from, to, q }).toString());
  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-lg font-bold text-navy">Export Records</h2>
      <p className="mt-1 text-sm text-ink/60">Exports contain registry data only — never keys, hashes or credentials.</p>
      <div className="card mt-4 grid gap-3 p-6 sm:grid-cols-2">
        <div><label className="label" htmlFor="f">Format</label>
          <select id="f" className="input" value={format} onChange={(e) => setFormat(e.target.value as 'json' | 'csv')}><option>json</option><option>csv</option></select></div>
        <div><label className="label" htmlFor="st">Status</label>
          <select id="st" className="input" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">all</option><option>VALID</option><option>REVOKED</option></select></div>
        <div><label className="label" htmlFor="fr">From</label><input id="fr" type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><label className="label" htmlFor="to">To</label><input id="to" type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="q">Recipient / organization</label><input id="q" className="input" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      <a className="btn-gold mt-4" href={href}>Download export</a>
    </div>
  );
}