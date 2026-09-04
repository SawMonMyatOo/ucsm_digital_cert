// client/src/pages/public/Home.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ucsmLogo from '../../assets/ucsm_logo.png';

export function Home() {
  const [id, setId] = useState('');
  const navigate = useNavigate();
  return (
    <main className="paper flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <img src={ucsmLogo} alt="UCSM Logo" className="h-24 w-24" />
      <h1 className="mt-4 font-display text-3xl font-bold text-navy">University of Computer Studies, Mandalay</h1>
      <p className="mt-1 font-display-sc text-sm tracking-[0.3em] text-gold-dark">DIGITAL CERTIFICATE VERIFICATION</p>
      <form className="mt-8 flex w-full max-w-md flex-col gap-2 sm:flex-row"
        onSubmit={(e) => { e.preventDefault(); if (id.trim()) navigate(`/verify/${id.trim()}`); }}>
        <input className="input flex-1" aria-label="Certificate ID" placeholder="UCSM-2026-000001" value={id} onChange={(e) => setId(e.target.value)} />
        <button className="btn-gold justify-center" type="submit">Verify</button>
      </form>
    </main>
  );
}