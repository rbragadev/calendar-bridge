import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { SyncLog } from '../types';
import { getAllLogs } from '../api/logs';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

export default function LogsPage() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      setLogs(await getAllLogs(100));
    } catch {
      setError('Falha ao carregar logs');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <Link to="/home" className="w-8 h-8 bg-white rounded-xl shadow-card flex items-center justify-center text-gray-400">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Logs de Sync</h1>
            <p className="text-xs text-gray-400">Histórico de sincronizações</p>
          </div>
        </div>
        <Button size="sm" variant="secondary" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-white rounded-2xl" />)}
        </div>
      ) : logs.length === 0 ? (
        <Card padding="lg" className="text-center space-y-3">
          <FileText size={32} className="text-gray-200 mx-auto" />
          <div>
            <p className="font-semibold text-gray-700">Nenhum log ainda</p>
            <p className="text-sm text-gray-400 mt-1">
              Execute um sync em uma bridge para ver os resultados aqui.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id} padding="md" className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {log.level === 'error' ? (
                    <AlertCircle size={16} className="text-red-500" />
                  ) : (
                    <CheckCircle size={16} className="text-green-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Badge variant={log.level === 'error' ? 'error' : 'active'}>
                      {log.level.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 mt-1">{log.message}</p>
                  {log.bridgeId && (
                    <p className="text-xs text-gray-400 mt-0.5 font-mono truncate">
                      Bridge: {log.bridgeId}
                    </p>
                  )}
                  {log.metadata && (
                    <pre className="text-xs text-gray-500 mt-1 bg-gray-50 rounded-xl px-3 py-2 overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
