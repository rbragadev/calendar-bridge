import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AccountsPage from './pages/AccountsPage';
import CalendarsPage from './pages/CalendarsPage';
import BridgesPage from './pages/BridgesPage';
import LogsPage from './pages/LogsPage';

export default function App() {
  return (
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
  );
}
