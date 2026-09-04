// client/src/pages/public/Home.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export function Home() {
  const [id, setId] = useState('');
  const navigate = useNavigate();
  return (
    <main className="paper flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <img src="/src/assets/ucsm_logo.png" alt="UCSM Logo" className="h-24 w-24" />
      <h1 className="mt-4 font-display text-3xl font-bold text-navy">University of Computer Studies, Mandalay</h1>
      <p className="mt-1 font-display-sc text-sm tracking-[0.3em] text-gold-dark">DIGITAL CERTIFICATE VERIFICATION</p>
      <form className="mt-8 flex w-full max-w-md gap-2"
        onSubmit={(e) => { e.preventDefault(); if (id.trim()) navigate(`/verify/${id.trim()}`); }}>
        <input className="input" aria-label="Certificate ID" placeholder="UCSM-2026-000001" value={id} onChange={(e) => setId(e.target.value)} />
        <button className="btn-gold" type="submit">Verify</button>
      </form>
        
    </main>
  );
}
//<p className="mt-6 text-sm text-ink/60">Administrators: <Link className="underline hover:text-gold-dark" to="/admin/login">Admin sign in</Link></p>