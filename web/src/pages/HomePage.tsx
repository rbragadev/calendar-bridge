import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowLeftRight, Settings, Shield, Activity, ChevronRight, Clock } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { listAccounts } from '../api/accounts';
import { listBridges } from '../api/bridges';
import { getAllLogs } from '../api/logs';
import { GoogleAccount, CalendarBridge, SyncLog } from '../types';

export default function HomePage() {
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [bridges, setBridges] = useState<CalendarBridge[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listAccounts(), listBridges(), getAllLogs(5)])
      .then(([a, b, l]) => { setAccounts(a); setBridges(b); setLogs(l); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeBridges = bridges.filter((b) => b.enabled);
  const lastLog = logs[0];
  const lastSyncTime = lastLog ? timeSince(lastLog.createdAt) : null;
  const syncHealthy = logs.slice(0, 5).every((l) => l.level === 'info');

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-white rounded-2xl w-40" />
        <div className="h-24 bg-white rounded-2xl" />
        <div className="h-40 bg-white rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="flex items-center gap-2 text-brand-600 font-bold text-base">
            <ArrowLeftRight size={18} />
            Calendar Bridge
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Overview</h1>
          <p className="text-sm text-gray-400">Resumo da sincronização</p>
        </div>
        <button className="w-9 h-9 bg-white rounded-xl shadow-card flex items-center justify-center text-gray-400 hover:text-gray-600">
          <Settings size={18} />
        </button>
      </div>

      {/* CTA button */}
      <Link to="/bridges">
        <Button fullWidth size="lg" className="rounded-2xl">
          <Plus size={18} />
          Nova bridge
        </Button>
      </Link>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card padding="md">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Contas Sincronizadas</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{accounts.length}</p>
          <Link to="/accounts" className="text-xs text-brand-600 font-medium mt-1 inline-block">
            Gerenciar
          </Link>
        </Card>
        <Card padding="md">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Agendas</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">—</p>
          <Link to="/calendars" className="text-xs text-brand-600 font-medium mt-1 inline-block">
            Ver todas
          </Link>
        </Card>
        <Card padding="md">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Bridges Ativas</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{activeBridges.length}</p>
          <Link to="/bridges" className="text-xs text-brand-600 font-medium mt-1 inline-block">
            Ver bridges
          </Link>
        </Card>
        <Card padding="md">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Último Sync</p>
          <div className="flex items-center gap-1 mt-1">
            <Clock size={16} className="text-brand-600" />
            <p className="text-lg font-bold text-gray-900">{lastSyncTime ?? '—'}</p>
          </div>
          <Link to="/logs" className="text-xs text-brand-600 font-medium mt-1 inline-block">
            Ver logs
          </Link>
        </Card>
      </div>

      {/* Recent bridges */}
      {bridges.length > 0 && (
        <Card padding="none">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h2 className="font-semibold text-gray-900 text-sm">Bridges Recentes</h2>
            <Link to="/bridges" className="text-xs text-brand-600 font-medium">Ver todas</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {bridges.slice(0, 3).map((bridge) => (
              <div key={bridge.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                  <ArrowLeftRight size={16} className="text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {bridge.sourceAccount?.googleEmail?.split('@')[0]} →{' '}
                    {bridge.targetAccount?.googleEmail?.split('@')[0]}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {bridge.sourceCalendarId}
                  </p>
                </div>
                <Badge variant={bridge.enabled ? 'active' : 'inactive'}>
                  {bridge.enabled ? 'Ativa' : 'Inativa'}
                </Badge>
                <ChevronRight size={16} className="text-gray-300" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sync health */}
      {logs.length > 0 && (
        <Card padding="md" className="space-y-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${syncHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
            <h2 className="font-semibold text-gray-900 text-sm">Saúde do Sync</h2>
          </div>
          <p className="text-xs text-gray-500">
            {syncHealthy
              ? 'Todos os sistemas operando corretamente.'
              : 'Alguns erros detectados. Verifique os logs.'}
          </p>
          {lastLog && (
            <p className="text-xs text-gray-400">
              Próxima execução: em breve (automático)
            </p>
          )}
        </Card>
      )}

      {/* Privacy card */}
      <Card padding="md" className="flex items-start gap-3">
        <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
          <Shield size={18} className="text-brand-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Privacidade Ativa</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Seus dados nunca saem das suas contas Google. Só horário e "Busy" são copiados.
          </p>
        </div>
      </Card>

      {/* Empty state */}
      {bridges.length === 0 && (
        <Card padding="lg" className="text-center space-y-3">
          <Activity size={32} className="text-brand-200 mx-auto" />
          <div>
            <p className="font-semibold text-gray-700">Nenhuma bridge ainda</p>
            <p className="text-sm text-gray-400 mt-1">
              Conecte suas contas Google e crie sua primeira bridge de sincronização.
            </p>
          </div>
          <Link to="/accounts">
            <Button size="sm" variant="secondary">Conectar conta Google</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

function timeSince(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '< 1 min';
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}
