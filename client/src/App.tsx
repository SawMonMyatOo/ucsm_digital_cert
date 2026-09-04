// client/src/App.tsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { type ReactNode } from 'react';
import { AuthProvider, useAuth } from './hooks/useSession';
import { AdminLayout } from './layouts/AdminLayout';
import { Login } from './pages/admin/Login';
import { Dashboard } from './pages/admin/Dashboard';
import { Certificates } from './pages/admin/Certificates';
import { CertificateCreate } from './pages/admin/CertificateCreate';
import { CertificateDetail } from './pages/admin/CertificateDetail';
import { Templates } from './pages/admin/Templates';
import { Validation } from './pages/admin/Validation';
import { Exports } from './pages/admin/Exports';
import { AuditLogs } from './pages/admin/AuditLogs';
import { Security } from './pages/admin/Security';
import { SettingsPage } from './pages/admin/SettingsPage';
import { CertificatePage } from './pages/public/CertificatePage';
import { VerifyPage } from './pages/public/VerifyPage';
import { Home } from './pages/public/Home';

function Protected({ children }: { children: ReactNode }) {
  const { username, loading } = useAuth();
  if (loading) return <p className="p-10 font-display-sc tracking-widest">Loading…</p>;
  if (!username) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<Protected><AdminLayout /></Protected>}>
            <Route index element={<Dashboard />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="certificates/create" element={<CertificateCreate />} />
            <Route path="certificates/:id" element={<CertificateDetail />} />
            <Route path="templates" element={<Templates />} />
            <Route path="validation" element={<Validation />} />
            <Route path="exports" element={<Exports />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="security" element={<Security />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="/certificate/:certificateId" element={<CertificatePage />} />
          <Route path="/verify/:certificateId" element={<VerifyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}