import { Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './api/auth';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import HomePage from './pages/HomePage';
import AccountsPage from './pages/AccountsPage';
import CalendarsPage from './pages/CalendarsPage';
import BridgesPage from './pages/BridgesPage';
import LogsPage from './pages/LogsPage';

function RequireAuth({ children }: Readonly<{ children: JSX.Element }>) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return children;
}

function AppShell({ children }: Readonly<{ children: JSX.Element }>) {
  return (
    <RequireAuth>
      <Layout>{children}</Layout>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Authenticated */}
      <Route path="/home" element={<AppShell><HomePage /></AppShell>} />
      <Route path="/accounts" element={<AppShell><AccountsPage /></AppShell>} />
      <Route path="/calendars" element={<AppShell><CalendarsPage /></AppShell>} />
      <Route path="/bridges" element={<AppShell><BridgesPage /></AppShell>} />
      <Route path="/logs" element={<AppShell><LogsPage /></AppShell>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
