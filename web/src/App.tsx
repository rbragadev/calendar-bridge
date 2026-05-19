import { Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './api/auth';
import Layout from './components/Layout';
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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      <Route
        path="/*"
        element={
          <RequireAuth>
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/accounts" element={<AccountsPage />} />
                <Route path="/calendars" element={<CalendarsPage />} />
                <Route path="/bridges" element={<BridgesPage />} />
                <Route path="/logs" element={<LogsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </RequireAuth>
        }
      />
    </Routes>
  );
}
