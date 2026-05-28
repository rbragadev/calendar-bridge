import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, ChevronDown, ArrowLeftRight } from 'lucide-react';
import { GoogleAccount, Calendar as Cal } from '../types';
import { listAccounts, listCalendars } from '../api/accounts';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

export default function CalendarsPage() {
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [calendars, setCalendars] = useState<Cal[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingCals, setLoadingCals] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listAccounts()
      .then((data) => {
        setAccounts(data);
        if (data.length > 0) setSelectedAccountId(data[0].id);
      })
      .catch(() => setError('Falha ao carregar contas'))
      .finally(() => setLoadingAccounts(false));
  }, []);

  useEffect(() => {
    if (!selectedAccountId) return;
    setLoadingCals(true);
    setError('');
    listCalendars(selectedAccountId)
      .then(setCalendars)
      .catch(() => setError('Falha ao carregar agendas'))
      .finally(() => setLoadingCals(false));
  }, [selectedAccountId]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pt-1">
        <Link to="/home" className="w-8 h-8 bg-white rounded-xl shadow-card flex items-center justify-center text-gray-400">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Agendas</h1>
          <p className="text-xs text-gray-400">Visualize as agendas disponíveis</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loadingAccounts ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-12 bg-white rounded-2xl" />
          <div className="h-20 bg-white rounded-2xl" />
        </div>
      ) : accounts.length === 0 ? (
        <Card padding="lg" className="text-center space-y-3">
          <Calendar size={32} className="text-gray-200 mx-auto" />
          <div>
            <p className="font-semibold text-gray-700">Nenhuma conta Google conectada</p>
            <p className="text-sm text-gray-400 mt-1">Conecte uma conta para ver suas agendas.</p>
          </div>
          <Link to="/accounts">
            <Button size="sm" variant="secondary">Conectar conta</Button>
          </Link>
        </Card>
      ) : (
        <>
          {/* Account selector */}
          <div className="relative">
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-card pr-10"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.googleEmail}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Calendars list */}
          {loadingCals ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white rounded-2xl" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Email group header */}
              <p className="text-xs text-gray-400 font-medium px-1">
                {accounts.find((a) => a.id === selectedAccountId)?.googleEmail}
              </p>

              {calendars.map((cal) => (
                <Card key={cal.id} padding="md" className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: cal.backgroundColor ? `${cal.backgroundColor}20` : '#EEF2FF' }}
                  >
                    <Calendar
                      size={18}
                      style={{ color: cal.backgroundColor || '#4F46E5' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 text-sm">{cal.summary}</p>
                      {cal.primary && <Badge variant="info">Principal</Badge>}
                    </div>
                    <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">{cal.id}</p>
                  </div>
                  <Link to="/bridges">
                    <button className="flex items-center gap-1 text-xs text-brand-600 font-medium bg-brand-50 hover:bg-brand-100 rounded-lg px-2.5 py-1.5 transition-colors whitespace-nowrap">
                      <ArrowLeftRight size={12} />
                      Criar bridge
                    </button>
                  </Link>
                </Card>
              ))}

              {calendars.length === 0 && (
                <Card padding="lg" className="text-center">
                  <p className="text-sm text-gray-400">Nenhuma agenda encontrada para esta conta.</p>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
