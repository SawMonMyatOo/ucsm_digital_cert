// client/src/pages/admin/Login.tsx
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useSession';
import ucsmLogo from '../../assets/ucsm_logo.png';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    try { await login(username, password); navigate('/admin'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Login failed'); }
  };

  return (
    <main className="paper flex min-h-screen items-center justify-center px-4">
      <form onSubmit={(e) => { void submit(e); }} className="card w-full max-w-sm border-t-4 border-t-gold p-8">
        <img src={ucsmLogo} alt="UCSM Logo" className="mx-auto h-16 w-16" />
        <h1 className="mt-3 text-center font-display text-xl font-bold text-navy">Administrator Sign In</h1>
        <p className="mb-6 text-center font-display-sc text-[10px] tracking-[0.25em] text-ink/60">CERTIFICATE REGISTRY</p>
        <label className="label" htmlFor="u">Username</label>
        <input id="u" className="input" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <label className="label mt-4" htmlFor="p">Password</label>
        <input id="p" type="password" className="input" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}
        <button className="btn-gold mt-6 w-full justify-center" type="submit">Sign in</button>
        <p className="mt-4 text-center text-[11px] text-ink/50">Sessions expire after inactivity · attempts are rate-limited.</p>
      </form>
    </main>
  );
}