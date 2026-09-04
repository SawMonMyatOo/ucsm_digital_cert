// client/src/components/CertificateTable.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Certificate } from '../types';
import { formatDate } from '../utils/format';
import { api } from '../services/api';

interface Props { items: Certificate[]; verifyBaseUrl: string; onChanged: () => void }

export function CertificateTable({ items, verifyBaseUrl, onChanged }: Props) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();
  const rows = items
    .filter((c) => !q || [c.certificateId, c.recipientName, c.organization].some((v) => v.toLowerCase().includes(q.toLowerCase())))
    .filter((c) => !status || c.status === status);

  const copyUrl = async (c: Certificate): Promise<void> => {
    const token = c.encryptedId || c.id;
    await navigator.clipboard.writeText(`${verifyBaseUrl}/verify/${token}`);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <input className="input max-w-xs" aria-label="Search certificates" placeholder="Search ID, recipient, organization…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input w-auto" aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option><option>VALID</option><option>REVOKED</option>
        </select>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm font-serif">
          <thead className="border-b border-gold/40 bg-parchment/60 font-display-sc text-xs tracking-widest text-navy">
            <tr>{['Certificate ID', 'Recipient', 'Type', 'Issue Date', 'Status', 'Actions'].map((hd) => <th key={hd} className="px-4 py-3">{hd}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-b border-ink/5 hover:bg-gold/5">
                <td className="px-4 py-3 font-display-sc tracking-wider">{c.certificateId}</td>
                <td className="px-4 py-3">{c.recipientName}</td>
                <td className="px-4 py-3">{c.certificateType}</td>
                <td className="px-4 py-3">{formatDate(c.issuedDate)}</td>
                <td className="px-4 py-3">
                  <span className={`border px-2 py-0.5 font-display-sc text-[11px] tracking-widest ${c.status === 'VALID' ? 'border-emerald-800 text-emerald-800' : 'border-red-800 text-red-800'}`}>{c.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Link className="underline hover:text-gold-dark" to={`/admin/certificates/${c.id}`}>View</Link>
                    <button type="button" className="underline hover:text-gold-dark" onClick={() => navigate(`/certificate/${c.encryptedId || c.certificateId}`)}>Download</button>
                    <button type="button" className="underline hover:text-gold-dark" onClick={() => void copyUrl(c)}>Copy URL</button>
                    {c.status === 'VALID' && (
                      <button type="button" className="underline text-red-800"
                        onClick={() => { if (window.confirm(`Revoke ${c.certificateId}?`)) void api.revoke(c.id).then(onChanged); }}>
                        Revoke
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-ink/60">No certificates match.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}