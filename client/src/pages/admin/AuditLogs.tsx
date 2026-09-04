// client/src/pages/admin/AuditLogs.tsx
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { AuditEntry } from '../../types';
import { formatDateTime } from '../../utils/format';

export function AuditLogs() {
  const [rows, setRows] = useState<AuditEntry[]>([]);
  useEffect(() => { api.audit().then(setRows).catch(() => undefined); }, []);
  return (
    <div>
      <h2 className="mb-4 font-display text-lg font-bold text-navy">Audit Log</h2>
      <div className="card overflow-x-auto">
        <table className="w-full text-left font-serif text-sm">
          <thead className="border-b border-gold/40 bg-parchment/60 font-display-sc text-xs tracking-widest text-navy">
            <tr>{['Time', 'Action', 'Actor', 'Certificate', 'IP'].map((hd) => <th key={hd} className="px-4 py-3">{hd}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-ink/5">
                <td className="px-4 py-2 whitespace-nowrap">{formatDateTime(r.timestamp)}</td>
                <td className="px-4 py-2 font-display-sc tracking-wider">{r.action}</td>
                <td className="px-4 py-2">{r.actor}</td>
                <td className="px-4 py-2">{r.certificateId ?? '—'}</td>
                <td className="px-4 py-2">{r.ip ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}