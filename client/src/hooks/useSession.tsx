// client/src/hooks/useSession.tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setCsrf } from '../services/api';

interface AuthState { username: string | null; loading: boolean; login: (u: string, p: string) => Promise<void>; logout: () => Promise<void> }
const Ctx = createContext<AuthState>({ username: null, loading: true, login: async () => undefined, logout: async () => undefined });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.session()
      .then((s) => { setUsername(s.username); setCsrf(s.csrfToken); })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (u: string, p: string) => {
    const s = await api.login(u, p);
    setCsrf(s.csrfToken);
    setUsername(s.username);
  }, []);

  const logout = useCallback(async () => {
    await api.logout().catch(() => undefined);
    setCsrf(null);
    setUsername(null);
  }, []);

  const value = useMemo(() => ({ username, loading, login, logout }), [username, loading, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useAuth = (): AuthState => useContext(Ctx);