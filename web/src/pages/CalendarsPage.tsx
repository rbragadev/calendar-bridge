import { useEffect, useState } from 'react';
import { GoogleAccount, Calendar } from '../types';
import { listAccounts, listCalendars } from '../api/accounts';

export default function CalendarsPage() {
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [calendars, setCalendars] = useState<Calendar[]>([]);
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Agendas</h1>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loadingAccounts ? (
        <p className="text-gray-500">Carregando contas...</p>
      ) : accounts.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-400">
          <p>Nenhuma conta Google conectada.</p>
          <a href="/accounts" className="text-blue-600 text-sm mt-1 inline-block hover:underline">
            Conectar uma conta
          </a>
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecionar conta
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.googleEmail}
                </option>
              ))}
            </select>
          </div>

          {loadingCals ? (
            <p className="text-gray-500">Carregando agendas...</p>
          ) : (
            <div className="space-y-2">
              {calendars.map((cal) => (
                <div
                  key={cal.id}
                  className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-3"
                >
                  {cal.backgroundColor && (
                    <span
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: cal.backgroundColor }}
                    />
                  )}
                  <div>
                    <p className="font-medium text-gray-800">
                      {cal.summary}
                      {cal.primary && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          Principal
                        </span>
                      )}
                    </p>
                    {cal.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{cal.description}</p>
                    )}
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{cal.id}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
