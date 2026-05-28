import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, ArrowLeftRight, X, ChevronLeft, ChevronRight,
  Zap, Lock, Trash2, RefreshCw, Power, Shield,
} from 'lucide-react';
import { GoogleAccount, Calendar, CalendarBridge, SyncResult } from '../types';
import { listAccounts, listCalendars } from '../api/accounts';
import { listBridges, createBridge, updateBridge, deleteBridge, syncBridge, clearBridgeSync } from '../api/bridges';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

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
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(1);
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
        if (a.length > 0) setForm((f) => ({ ...f, sourceAccountId: a[0].id, targetAccountId: a[0].id }));
      })
      .catch(() => setError('Falha ao carregar dados'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!form.sourceAccountId) return;
    listCalendars(form.sourceAccountId)
      .then((cals) => { setSrcCalendars(cals); setForm((f) => ({ ...f, sourceCalendarId: cals[0]?.id || '' })); })
      .catch(() => {});
  }, [form.sourceAccountId]);

  useEffect(() => {
    if (!form.targetAccountId) return;
    listCalendars(form.targetAccountId)
      .then((cals) => { setTgtCalendars(cals); setForm((f) => ({ ...f, targetCalendarId: cals[0]?.id || '' })); })
      .catch(() => {});
  }, [form.targetAccountId]);

  function set(field: keyof FormState, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function openWizard() {
    const firstId = accounts[0]?.id || '';
    setForm({ ...EMPTY_FORM, sourceAccountId: firstId, targetAccountId: firstId });
    setShowWizard(true);
    setStep(1);
    setError('');
  }
  function closeWizard() { setShowWizard(false); setStep(1); }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const bridge = await createBridge(form);
      setBridges((prev) => [bridge, ...prev]);
      closeWizard();
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
    } catch { setError('Falha ao atualizar bridge'); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover esta bridge?')) return;
    try {
      await deleteBridge(id);
      setBridges((prev) => prev.filter((b) => b.id !== id));
    } catch { setError('Falha ao remover bridge'); }
  }

  async function handleSync(id: string) {
    setSyncingId(id);
    try {
      const result = await syncBridge(id);
      setLastSync((prev) => ({ ...prev, [id]: result }));
    } catch { setError('Falha ao sincronizar'); }
    finally { setSyncingId(''); }
  }

  async function handleClear(id: string) {
    if (!confirm('Deletar todos os eventos "Busy" criados por esta bridge?')) return;
    setClearingId(id);
    try {
      await clearBridgeSync(id);
      setLastSync((prev) => { const n = { ...prev }; delete n[id]; return n; });
    } catch { setError('Falha ao limpar sync'); }
    finally { setClearingId(''); }
  }

  const selectedSrcEmail = accounts.find((a) => a.id === form.sourceAccountId)?.googleEmail ?? '';
  const selectedTgtEmail = accounts.find((a) => a.id === form.targetAccountId)?.googleEmail ?? '';
  const selectedSrcCal = srcCalendars.find((c) => c.id === form.sourceCalendarId)?.summary ?? '';
  const selectedTgtCal = tgtCalendars.find((c) => c.id === form.targetCalendarId)?.summary ?? '';

  return (
    <div className="space-y-4 relative">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <Link to="/home" className="w-8 h-8 bg-white rounded-xl shadow-card flex items-center justify-center text-gray-400">
            <ChevronLeft size={16} />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Bridges</h1>
        </div>
        <Button size="sm" onClick={openWizard}>
          <Plus size={15} />
          Nova bridge
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2].map((i) => <div key={i} className="h-28 bg-white rounded-2xl" />)}
        </div>
      )}

      {/* Bridges list */}
      {!loading && bridges.length > 0 && (
        <div className="space-y-3">
          {bridges.map((bridge) => (
            <Card key={bridge.id} padding="md" className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {bridge.sourceAccount?.googleEmail?.split('@')[0]}
                    </span>
                    <ArrowLeftRight size={14} className="text-brand-500 shrink-0" />
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {bridge.targetAccount?.googleEmail?.split('@')[0]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 font-mono truncate">
                    {bridge.sourceCalendarId}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Título: "{bridge.titleTemplate}" · {bridge.syncPastDays}d / {bridge.syncFutureDays}d
                  </p>
                </div>
                <Badge variant={bridge.enabled ? 'active' : 'inactive'}>
                  {bridge.enabled ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>

              {lastSync[bridge.id] && (
                <div className="bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-500">
                  Sync: {lastSync[bridge.id].created} criados · {lastSync[bridge.id].updated} atualizados · {lastSync[bridge.id].deleted} deletados
                  {lastSync[bridge.id].errors.length > 0 && (
                    <span className="text-red-500 ml-1">· {lastSync[bridge.id].errors.length} erro(s)</span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 border-t border-gray-50 pt-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={() => handleSync(bridge.id)}
                  disabled={syncingId === bridge.id}
                  className="flex-1"
                >
                  <RefreshCw size={13} className={syncingId === bridge.id ? 'animate-spin' : ''} />
                  {syncingId === bridge.id ? 'Sincronizando...' : 'Sincronizar'}
                </Button>
                <button
                  onClick={() => handleToggle(bridge)}
                  title={bridge.enabled ? 'Desativar' : 'Ativar'}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Power size={15} className={bridge.enabled ? 'text-green-500' : ''} />
                </button>
                <button
                  onClick={() => handleClear(bridge.id)}
                  disabled={clearingId === bridge.id}
                  title="Limpar sync"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                >
                  <X size={15} />
                </button>
                <button
                  onClick={() => handleDelete(bridge.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && bridges.length === 0 && (
        <div className="space-y-4">
          <Card padding="lg" className="text-center space-y-3">
            <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto">
              <ArrowLeftRight size={24} className="text-brand-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Conecte seus mundos</h2>
              <p className="text-sm text-gray-400 mt-1">
                Crie pontes de sincronização entre suas agendas Google para bloquear compromissos automaticamente.
              </p>
            </div>
            <Button onClick={openWizard} fullWidth>
              <Plus size={16} />
              Criar primeira bridge
            </Button>
          </Card>

          <Card padding="md" className="flex items-start gap-3">
            <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
              <Shield size={18} className="text-brand-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Privacidade em Primeiro Lugar</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Apenas horário e título "Busy" são copiados. Detalhes do evento ficam privados.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeWizard} />
          <div className="relative bg-white rounded-t-3xl md:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Wizard header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-2 text-brand-600 font-bold">
                <ArrowLeftRight size={16} />
                Calendar Bridge
              </div>
              <button onClick={closeWizard} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-1.5 pb-4">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${
                    s === step ? 'w-8 bg-brand-600' : s < step ? 'w-4 bg-brand-300' : 'w-4 bg-gray-200'
                  }`}
                />
              ))}
            </div>

            <div className="px-5 pb-6 space-y-5">
              {/* Step 1: Source */}
              {step === 1 && (
                <>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Origem da Sincronização</h2>
                    <p className="text-sm text-gray-400 mt-1">
                      Selecione a conta e a agenda de onde os eventos serão lidos.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Conta Google
                      </label>
                      <div className="relative">
                        <select
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                          value={form.sourceAccountId}
                          onChange={(e) => set('sourceAccountId', e.target.value)}
                        >
                          {accounts.map((a) => <option key={a.id} value={a.id}>{a.googleEmail}</option>)}
                        </select>
                        <ChevronRight size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none rotate-90" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Agenda de Origem
                      </label>
                      <div className="relative">
                        <select
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                          value={form.sourceCalendarId}
                          onChange={(e) => set('sourceCalendarId', e.target.value)}
                        >
                          {srcCalendars.map((c) => <option key={c.id} value={c.id}>{c.summary}</option>)}
                        </select>
                        <ChevronRight size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="secondary" onClick={closeWizard}>Cancelar</Button>
                    <Button onClick={() => setStep(2)} disabled={!form.sourceCalendarId}>
                      Próximo
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-brand-50 rounded-xl px-3 py-2.5">
                      <Zap size={16} className="text-brand-600 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-brand-800">Sincronização Instantânea</p>
                        <p className="text-xs text-brand-600">Tempo Real</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-orange-50 rounded-xl px-3 py-2.5">
                      <Lock size={16} className="text-orange-600 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-orange-800">Criptografia</p>
                        <p className="text-xs text-orange-600">E2EE Protocol</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Target */}
              {step === 2 && (
                <>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Destino da Sincronização</h2>
                    <p className="text-sm text-gray-400 mt-1">
                      Selecione onde os bloqueios "Busy" serão criados.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Conta Google (destino)
                      </label>
                      <div className="relative">
                        <select
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                          value={form.targetAccountId}
                          onChange={(e) => set('targetAccountId', e.target.value)}
                        >
                          {accounts.map((a) => <option key={a.id} value={a.id}>{a.googleEmail}</option>)}
                        </select>
                        <ChevronRight size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none rotate-90" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Agenda de Destino
                      </label>
                      <div className="relative">
                        <select
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                          value={form.targetCalendarId}
                          onChange={(e) => set('targetCalendarId', e.target.value)}
                        >
                          {tgtCalendars.map((c) => <option key={c.id} value={c.id}>{c.summary}</option>)}
                        </select>
                        <ChevronRight size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="secondary" onClick={() => setStep(1)}>Voltar</Button>
                    <Button onClick={() => setStep(3)} disabled={!form.targetCalendarId}>
                      Próximo
                    </Button>
                  </div>
                </>
              )}

              {/* Step 3: Config & Confirm */}
              {step === 3 && (
                <>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Configurações</h2>
                    <p className="text-sm text-gray-400 mt-1">Revise e confirme os detalhes da bridge.</p>
                  </div>

                  {/* Summary */}
                  <div className="bg-brand-50 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-brand-900">
                      <span className="truncate">{selectedSrcEmail.split('@')[0]}</span>
                      <ArrowLeftRight size={14} className="text-brand-600 shrink-0" />
                      <span className="truncate">{selectedTgtEmail.split('@')[0]}</span>
                    </div>
                    <p className="text-xs text-brand-600">{selectedSrcCal} → {selectedTgtCal}</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Título do bloqueio
                      </label>
                      <input
                        type="text"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        value={form.titleTemplate}
                        onChange={(e) => set('titleTemplate', e.target.value)}
                        placeholder="Busy"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Dias passados
                        </label>
                        <input
                          type="number"
                          min={0}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                          value={form.syncPastDays}
                          onChange={(e) => set('syncPastDays', parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Dias futuros
                        </label>
                        <input
                          type="number"
                          min={1}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                          value={form.syncFutureDays}
                          onChange={(e) => set('syncFutureDays', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="secondary" onClick={() => setStep(2)}>Voltar</Button>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? 'Criando...' : 'Criar Bridge'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
