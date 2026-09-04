// client/src/pages/admin/Dashboard.tsx
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { Certificate, Settings, Template } from '../../types';
import { StatCard } from '../../components/StatCard';
import { CertificateTable } from '../../components/CertificateTable';

export function Dashboard() {
  const [items, setItems] = useState<Certificate[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const load = useCallback(() => {
    api.certificates().then((r) => { setItems(r.items); setTemplates(r.templates); setSettings(r.settings); }).catch(() => undefined);
  }, []);
  useEffect(load, [load]);

  const valid = items.filter((c) => c.status === 'VALID').length;
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Certificates" value={items.length} />
        <StatCard label="Valid" value={valid} accent="green" />
        <StatCard label="Revoked" value={items.length - valid} accent="red" />
        <StatCard label="Templates" value={templates.length} />
        <StatCard label="Verifications" value={settings?.stats.total ?? 0} accent="gold" />
      </div>
      <h2 className="mt-8 mb-3 font-display text-lg font-bold text-navy">Certificates</h2>
      <CertificateTable items={items} verifyBaseUrl={settings?.verifyBaseUrl ?? ''} onChanged={load} />
    </div>
  );
}