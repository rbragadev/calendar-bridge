import { useEffect, useState } from 'react';
import { GoogleAccount, Calendar, CalendarBridge, SyncResult } from '../types';
import { listAccounts, listCalendars } from '../api/accounts';
import { listBridges, createBridge, updateBridge, deleteBridge, syncBridge, clearBridgeSync } from '../api/bridges';

interface FormState {
  sourceAccountId: string;
  sourceCalendarId: string;
  targetAccountId: string;
  targetCalendarId: string;
  titleTemplate: string;
  syncPastDays: number;
  syncFutureDays: number;
  enabled: boolean;
}

const EMPTY_FORM: FormState = {
  sourceAccountId: '',
  sourceCalendarId: '',
  targetAccountId: '',
  targetCalendarId: '',
  titleTemplate: 'Busy',
  syncPastDays: 1,
  syncFutureDays: 30,
  enabled: true,
};

export default function BridgesPage() {
  const [bridges, setBridges] = useState<CalendarBridge[]>([]);
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [srcCalendars, setSrcCalendars] = useState<Calendar[]>([]);
  const [tgtCalendars, setTgtCalendars] = useState<Calendar[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncingId, setSyncingId] = useState('');
  const [clearingId, setClearingId] = useState('');
  const [lastSync, setLastSync] = useState<Record<string, SyncResult>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listBridges(), listAccounts()])
      .then(([b, a]) => {
        setBridges(b);
        setAccounts(a);
        if (a.length > 0) {
          setForm((f) => ({ ...f, sourceAccountId: a[0].id, targetAccountId: a[0].id }));
        }
      })
      .catch(() => setError('Falha ao carregar dados'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!form.sourceAccountId) return;
    listCalendars(form.sourceAccountId)
      .then((cals) => {
        setSrcCalendars(cals);
        setForm((f) => ({ ...f, sourceCalendarId: cals[0]?.id || '' }));
      })
      .catch(() => {});
  }, [form.sourceAccountId]);

  useEffect(() => {
    if (!form.targetAccountId) return;
    listCalendars(form.targetAccountId)
      .then((cals) => {
        setTgtCalendars(cals);
        setForm((f) => ({ ...f, targetCalendarId: cals[0]?.id || '' }));
      })
      .catch(() => {});
  }, [form.targetAccountId]);

  function set(field: keyof FormState, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const bridge = await createBridge(form);
      setBridges((prev) => [bridge, ...prev]);
      setShowForm(false);
      setForm(EMPTY_FORM);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Falha ao criar bridge');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(bridge: CalendarBridge) {
    try {
      const updated = await updateBridge(bridge.id, { enabled: !bridge.enabled });
      setBridges((prev) => prev.map((b) => (b.id === bridge.id ? updated : b)));
    } catch {
      setError('Falha ao atualizar bridge');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover esta bridge? Isso não deleta eventos já criados no destino.')) return;
    try {
      await deleteBridge(id);
      setBridges((prev) => prev.filter((b) => b.id !== id));
    } catch {
      setError('Falha ao remover bridge');
    }
  }

  async function handleSync(id: string) {
    setSyncingId(id);
    setError('');
    try {
      const result = await syncBridge(id);
      setLastSync((prev) => ({ ...prev, [id]: result }));
    } catch {
      setError('Falha ao sincronizar');
    } finally {
      setSyncingId('');
    }
  }

  async function handleClear(id: string) {
    if (!confirm('Isso vai deletar todos os eventos "Ocupado" criados por esta bridge no calendário destino. Continuar?')) return;
    setClearingId(id);
    setError('');
    try {
      await clearBridgeSync(id);
      setLastSync((prev) => { const n = { ...prev }; delete n[id]; return n; });
    } catch {
      setError('Falha ao limpar sync');
    } finally {
      setClearingId('');
    }
  }

  if (loading) return <p className="text-gray-500">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Bridges</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          {showForm ? 'Cancelar' : '+ Nova Bridge'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSave}
          className="bg-white border border-gray-200 rounded-xl p-6 space-y-4"
        >
          <h2 className="font-semibold text-gray-800 text-lg">Nova Bridge</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conta origem
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.sourceAccountId}
                onChange={(e) => set('sourceAccountId', e.target.value)}
                required
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.googleEmail}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agenda origem
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.sourceCalendarId}
                onChange={(e) => set('sourceCalendarId', e.target.value)}
                required
              >
                {srcCalendars.map((c) => (
                  <option key={c.id} value={c.id}>{c.summary}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conta destino
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.targetAccountId}
                onChange={(e) => set('targetAccountId', e.target.value)}
                required
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.googleEmail}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agenda destino
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.targetCalendarId}
                onChange={(e) => set('targetCalendarId', e.target.value)}
                required
              >
                {tgtCalendars.map((c) => (
                  <option key={c.id} value={c.id}>{c.summary}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título do bloqueio
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.titleTemplate}
                onChange={(e) => set('titleTemplate', e.target.value)}
                placeholder="Busy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dias passados
              </label>
              <input
                type="number"
                min={0}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.syncPastDays}
                onChange={(e) => set('syncPastDays', Number.parseInt(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dias futuros
              </label>
              <input
                type="number"
                min={1}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.syncFutureDays}
                onChange={(e) => set('syncFutureDays', Number.parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={form.enabled}
              onChange={(e) => set('enabled', e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="enabled" className="text-sm text-gray-700">
              Ativar bridge imediatamente
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-2 rounded-lg font-medium"
          >
            {saving ? 'Salvando...' : 'Criar Bridge'}
          </button>
        </form>
      )}

      {bridges.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-400">
          <p>Nenhuma bridge criada ainda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bridges.map((bridge) => (
            <div key={bridge.id} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-800">
                      {bridge.sourceAccount?.googleEmail}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="font-medium text-gray-800">
                      {bridge.targetAccount?.googleEmail}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        bridge.enabled
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {bridge.enabled ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 font-mono">
                    {bridge.sourceCalendarId} → {bridge.targetCalendarId}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Título: "{bridge.titleTemplate}" · {bridge.syncPastDays}d passados · {bridge.syncFutureDays}d futuros
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleSync(bridge.id)}
                    disabled={syncingId === bridge.id}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs px-3 py-1.5 rounded-lg font-medium"
                  >
                    {syncingId === bridge.id ? 'Sincronizando...' : 'Sincronizar'}
                  </button>
                  <button
                    onClick={() => handleToggle(bridge)}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium border border-gray-300 hover:bg-gray-50"
                  >
                    {bridge.enabled ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => handleClear(bridge.id)}
                    disabled={clearingId === bridge.id}
                    className="text-orange-600 hover:text-orange-800 disabled:opacity-60 text-xs px-3 py-1.5 rounded-lg font-medium border border-orange-200 hover:bg-orange-50"
                  >
                    {clearingId === bridge.id ? 'Limpando...' : 'Limpar sync'}
                  </button>
                  <button
                    onClick={() => handleDelete(bridge.id)}
                    className="text-red-500 hover:text-red-700 text-xs px-3 py-1.5 rounded-lg font-medium border border-red-200 hover:bg-red-50"
                  >
                    Remover
                  </button>
                </div>
              </div>

              {lastSync[bridge.id] && (
                <div className="bg-gray-50 rounded-lg px-4 py-2 text-xs text-gray-600">
                  Último sync: {lastSync[bridge.id].created} criados · {lastSync[bridge.id].updated} atualizados · {lastSync[bridge.id].deleted} deletados
                  {lastSync[bridge.id].errors.length > 0 && (
                    <span className="text-red-600 ml-2">
                      · {lastSync[bridge.id].errors.length} erro(s)
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
