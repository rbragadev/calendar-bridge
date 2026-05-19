import { useEffect, useState } from 'react';
import { SyncLog } from '../types';
import { getAllLogs } from '../api/logs';

export default function LogsPage() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await getAllLogs(100);
      setLogs(data);
    } catch {
      setError('Falha ao carregar logs');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('pt-BR');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Logs de Sincronização</h1>
        <button
          onClick={load}
          className="text-sm border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg"
        >
          Atualizar
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : logs.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-400">
          <p>Nenhum log de sincronização ainda.</p>
          <p className="text-sm mt-1">Execute um sync em uma bridge para ver os resultados aqui.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`bg-white border rounded-xl px-5 py-4 ${
                log.level === 'error' ? 'border-red-200' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                      log.level === 'error'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {log.level.toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm text-gray-800">{log.message}</p>
                    {log.bridgeId && (
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">
                        Bridge: {log.bridgeId}
                      </p>
                    )}
                    {log.metadata && (
                      <pre className="text-xs text-gray-500 mt-1 bg-gray-50 rounded px-2 py-1 overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{formatDate(log.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
