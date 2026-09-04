// client/src/pages/admin/Certificates.tsx — same registry view with full filtering
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import type { Certificate, Settings } from '../../types';
import { CertificateTable } from '../../components/CertificateTable';

export function Certificates() {
  const [items, setItems] = useState<Certificate[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const load = useCallback(() => { api.certificates().then((r) => { setItems(r.items); setSettings(r.settings); }).catch(() => undefined); }, []);
  useEffect(load, [load]);
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-navy">Certificate Registry</h2>
        <Link to="/admin/certificates/create" className="btn-gold">+ Issue Certificate</Link>
      </div>
      <CertificateTable items={items} verifyBaseUrl={settings?.verifyBaseUrl ?? ''} onChanged={load} />
    </div>
  );
}