// client/src/layouts/AdminLayout.tsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useSession';
import { useEffect, useState } from 'react';
import { api } from '../services/api';

const LINKS = [
  ['/admin', 'Dashboard'], ['/admin/certificates', 'Certificates'], ['/admin/templates', 'Templates'],
  ['/admin/validation', 'Validation'], ['/admin/exports', 'Exports'], ['/admin/audit', 'Audit Logs'],
  ['/admin/security', 'Security'], ['/admin/settings', 'Settings']
] as const;

export function AdminLayout() {
  const { username, logout } = useAuth();
  const navigate = useNavigate();
  const [sec, setSec] = useState<string>('');

  useEffect(() => { api.securityStatus().then((s) => setSec(s.signing.algorithm)).catch(() => undefined); }, []);

  return (
    <div className="flex min-h-screen bg-ivory">
      <aside className="w-60 shrink-0 bg-navy-deep text-ivory flex flex-col" aria-label="Admin navigation">
        <div className="border-b border-gold/30 px-5 py-5">
          <p className="font-display text-lg font-bold text-gold-light">UCSM</p>
          <p className="font-display-sc text-[10px] tracking-[0.25em] text-ivory/70">CERTIFICATE REGISTRY</p>
        </div>
        <nav className="flex-1 py-4">
          {LINKS.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/admin'}
              className={({ isActive }) => `block border-l-2 px-5 py-2.5 font-display-sc text-sm tracking-widest ${isActive ? 'border-gold bg-navy text-gold-light' : 'border-transparent text-ivory/80 hover:text-gold-light'}`}>
              {label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="border-t border-gold/30 px-5 py-4 text-left font-display-sc text-sm tracking-widest text-ivory/80 hover:text-gold-light"
          onClick={() => { void logout().then(() => navigate('/admin/login')); }}>
          Logout
        </button>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="flex items-center justify-between border-b border-gold/40 bg-white/80 px-8 py-4">
          <div>
            <h1 className="font-display text-xl font-bold text-navy">University of Computer Studies, Mandalay</h1>
            <p className="font-display-sc text-[11px] tracking-[0.25em] text-ink/60">DIGITAL CERTIFICATE MANAGEMENT SYSTEM</p>
          </div>
          <div className="text-right text-xs font-serif text-ink/70">
            <p>Admin: <span className="font-semibold">{username}</span></p>
            <p className="text-emerald-800">● {sec || 'Security: active'}</p>
          </div>
        </header>
        <main className="p-8"><Outlet /></main>
      </div>
    </div>
  );
}