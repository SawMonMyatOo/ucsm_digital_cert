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
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('ucsm-nav-collapsed') === '1'; } catch { return false; }
  });

  const toggleCollapsed = (): void => setCollapsed((c) => {
    try { localStorage.setItem('ucsm-nav-collapsed', c ? '0' : '1'); } catch { /* ignore */ }
    return !c;
  });

  useEffect(() => { api.securityStatus().then((s) => setSec(s.signing.algorithm)).catch(() => undefined); }, []);

  const sidebar = (
    <>
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
    </>
  );

  return (
    <div className="flex min-h-screen bg-ivory">
      {/* Desktop sidebar (collapsible on lg+) */}
      <aside
        className={`hidden shrink-0 overflow-hidden bg-navy-deep text-ivory transition-all duration-300 lg:flex lg:flex-col ${collapsed ? 'lg:w-0' : 'lg:w-60'}`}
        aria-label="Admin navigation"
        aria-hidden={collapsed}
      >
        <div className="w-60 min-w-60 shrink-0 flex-1 flex flex-col">
          {sidebar}
        </div>
      </aside>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setOpen(false)} aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 shrink-0 bg-navy-deep text-ivory transition-transform duration-300 lg:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Admin navigation"
        aria-hidden={!open}
      >
        {sidebar}
      </aside>

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-gold/40 bg-white/80 px-4 py-3 backdrop-blur sm:px-8 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="hidden shrink-0 rounded border border-navy/30 px-2.5 py-1 font-display-sc text-xs tracking-widest text-navy lg:inline-flex"
              onClick={toggleCollapsed}
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'Show navigation menu' : 'Hide navigation menu'}
            >
              {collapsed ? '☰ Menu' : '◀ Hide'}
            </button>
            <button
              type="button"
              className="shrink-0 rounded border border-navy/30 px-2.5 py-1 font-display-sc text-xs tracking-widest text-navy lg:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label="Toggle navigation menu"
            >
              ☰ Menu
            </button>
            <div className="min-w-0">
              <h1 className="truncate font-display text-base font-bold text-navy sm:text-xl">University of Computer Studies, Mandalay</h1>
              <p className="hidden truncate font-display-sc text-[11px] tracking-[0.25em] text-ink/60 sm:block">DIGITAL CERTIFICATE MANAGEMENT SYSTEM</p>
            </div>
          </div>
          <div className="shrink-0 text-right text-xs font-serif text-ink/70">
            <p className="truncate">Admin: <span className="font-semibold">{username}</span></p>
            <p className="text-emerald-800">● {sec || 'Security: active'}</p>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}