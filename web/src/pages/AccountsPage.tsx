import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GoogleAccount } from '../types';
import { listAccounts, deleteAccount, getOAuthUrl } from '../api/accounts';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [copyingLink, setCopyingLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const connected = searchParams.get('connected');
  const oauthError = searchParams.get('error');

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (connected || oauthError) {
      const timer = setTimeout(() => setSearchParams({}), 4000);
      return () => clearTimeout(timer);
    }
  }, [connected, oauthError, setSearchParams]);

  async function load() {
    setLoading(true);
    try {
      const data = await listAccounts();
      setAccounts(data);
    } catch {
      setError('Falha ao carregar contas');
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    setConnecting(true);
    try {
      const url = await getOAuthUrl();
      globalThis.location.href = url;
    } catch {
      setError('Falha ao obter URL de autorização');
      setConnecting(false);
    }
  }

  async function handleCopyLink() {
    setCopyingLink(true);
    try {
      const url = await getOAuthUrl();
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setError('Falha ao copiar link');
    } finally {
      setCopyingLink(false);
    }
  }

  async function handleDelete(id: string, email: string) {
    if (!confirm(`Remover conta ${email}? Isso deletará todas as bridges associadas.`)) return;
    try {
      await deleteAccount(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setError('Falha ao remover conta');
    }
  }

  const copyLinkLabel = copyingLink ? 'Gerando...' : '🔗 Copiar link de conexão';

  function renderList() {
    if (loading) return <p className="text-gray-500">Carregando...</p>;
    if (accounts.length === 0) {
      return (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-400">
          <p className="text-lg">Nenhuma conta conectada ainda</p>
          <p className="text-sm mt-1">Clique em "Conectar conta Google" para começar</p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-gray-800">{acc.googleEmail}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Conectado em {new Date(acc.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <button
              onClick={() => handleDelete(acc.id, acc.googleEmail)}
              className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
            >
              Remover
            </button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-800">Contas Google</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            disabled={copyingLink}
            title="Gera um link OAuth. Abra em outro perfil do Chrome para conectar uma conta diferente."
            className="border border-gray-300 hover:bg-gray-50 disabled:opacity-60 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            {copied ? '✅ Link copiado!' : copyLinkLabel}
          </button>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {connecting ? 'Redirecionando...' : '+ Conectar conta Google'}
          </button>
        </div>
      </div>

      {copied && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-4 py-3 text-sm">
          🔗 Link copiado! Cole e abra em outro perfil do Chrome onde a outra conta Google está logada.
          O link expira em alguns minutos.
        </div>
      )}
      {connected && (
        <div className="bg-green-50 border border-green-300 text-green-800 rounded-lg px-4 py-3 text-sm">
          ✅ Conta conectada com sucesso!
        </div>
      )}
      {oauthError && (
        <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg px-4 py-3 text-sm">
          ❌ Erro ao conectar: {oauthError}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {renderList()}
    </div>
  );
}
