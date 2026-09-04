// client/src/pages/admin/SettingsPage.tsx
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { Settings } from '../../types';

export function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [saved, setSaved] = useState('');
  useEffect(() => { api.settings().then(setS).catch(() => undefined); }, []);
  if (!s) return <p className="font-display-sc tracking-widest">Loading…</p>;

  const save = async (): Promise<void> => {
    const next = await api.saveSettings(s);
    setS(next); setSaved('Saved ✓'); setTimeout(() => setSaved(''), 2000);
  };

  return (
    <div className="max-w-xl">
      <h2 className="font-display text-lg font-bold text-navy">Settings</h2>
      <div className="card mt-4 grid gap-3 p-6">
        <div><label className="label" htmlFor="o">Organization name</label><input id="o" className="input" value={s.orgName} onChange={(e) => setS({ ...s, orgName: e.target.value })} /></div>
        <div><label className="label" htmlFor="v">Verification base URL (QR target)</label><input id="v" className="input" value={s.verifyBaseUrl} onChange={(e) => setS({ ...s, verifyBaseUrl: e.target.value })} /></div>
        <div><label className="label" htmlFor="t">Session timeout (minutes)</label><input id="t" type="number" min={5} max={240} className="input" value={s.sessionTimeoutMinutes} onChange={(e) => setS({ ...s, sessionTimeoutMinutes: Number(e.target.value) })} /></div>
        <button type="button" className="btn-gold justify-center" onClick={() => void save()}>Save</button>
        {saved && <p className="text-sm text-emerald-800">{saved}</p>}
      </div>
    </div>
  );
}