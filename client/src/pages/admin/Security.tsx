// client/src/pages/admin/Security.tsx
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { SecurityStatus } from '../../types';

export function Security() {
  const [s, setS] = useState<SecurityStatus | null>(null);
  useEffect(() => { api.securityStatus().then(setS).catch(() => undefined); }, []);
  if (!s) return <p className="font-display-sc tracking-widest">Loading…</p>;
  const Item = ({ k, v }: { k: string; v: string }) => (
    <div className="card p-5"><p className="font-display-sc text-xs tracking-widest text-navy/70">{k}</p><p className="mt-1 break-words font-serif text-sm">{v}</p></div>
  );
  return (
    <div>
      <h2 className="mb-4 font-display text-lg font-bold text-navy">Security Posture</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Item k="DIGITAL SIGNATURE" v={`${s.signing.algorithm} · fingerprint ${s.signing.fingerprint.slice(0, 24)}…`} />
        <Item k="ENCRYPTION AT REST" v={s.encryption} />
        <Item k="PASSWORD HASHING" v={s.passwordHashing} />
        <Item k="SESSIONS" v={`${s.sessions.cookie} · ${s.sessions.timeoutMinutes} min`} />
        <Item k="HEADERS & LIMITS" v={s.headers} />
        <Item k="STORAGE" v={s.storage} />
      </div>
      <details className="card mt-4 p-5">
        <summary className="cursor-pointer font-display-sc text-xs tracking-widest text-navy">PUBLIC VERIFICATION KEY (SPKI)</summary>
        <pre className="mt-3 max-h-64 overflow-auto text-[10px]">{s.signing.publicPem}</pre>
      </details>
    </div>
  );
}