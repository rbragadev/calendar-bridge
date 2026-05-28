import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, User, Calendar, Trash2, ExternalLink, Copy, Check } from 'lucide-react';
import { GoogleAccount } from '../types';
import { listAccounts, deleteAccount, getOAuthUrl } from '../api/accounts';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

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
      setAccounts(await listAccounts());
    } catch {
      setError('Falha ao carregar contas');
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    setConnecting(true);
    try {
      globalThis.location.href = await getOAuthUrl();
    } catch {
      setError('Falha ao obter URL de autorização');
      setConnecting(false);
    }
  }

  async function handleCopyLink() {
    setCopyingLink(true);
    try {
      await navigator.clipboard.writeText(await getOAuthUrl());
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <Link to="/home" className="w-8 h-8 bg-white rounded-xl shadow-card flex items-center justify-center text-gray-400">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Contas Google</h1>
            <p className="text-xs text-gray-400">Gerencie suas conexões do Google Calendar</p>
          </div>
        </div>
        <Button size="sm" onClick={handleConnect} disabled={connecting}>
          {connecting ? '...' : 'Conectar agora'}
        </Button>
      </div>

      {/* Alerts */}
      {connected && (
        <div className="bg-green-50 border border-green-100 text-green-700 rounded-2xl px-4 py-3 text-sm flex items-center gap-2">
          <Check size={16} />
          Conta conectada com sucesso!
        </div>
      )}
      {oauthError && (
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3 text-sm">
          Erro ao conectar: {oauthError}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {copied && (
        <div className="bg-brand-50 border border-brand-100 text-brand-700 rounded-2xl px-4 py-3 text-sm">
          Link copiado! Cole em outro perfil do Chrome com a conta desejada.
        </div>
      )}

      {/* Connect button */}
      <Button
        variant="secondary"
        fullWidth
        size="lg"
        onClick={handleConnect}
        disabled={connecting}
        className="rounded-2xl"
      >
        <Plus size={18} />
        {connecting ? 'Redirecionando...' : 'Conectar conta Google'}
      </Button>

      {/* Loading */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && accounts.length === 0 && (
        <Card padding="lg" className="text-center space-y-3">
          <User size={32} className="text-gray-200 mx-auto" />
          <div>
            <p className="font-semibold text-gray-700">Nenhuma conta conectada</p>
            <p className="text-sm text-gray-400 mt-1">
              Conecte múltiplas contas para sincronizar entre elas.
            </p>
          </div>
        </Card>
      )}

      {/* Accounts list */}
      {!loading && accounts.length > 0 && (
        <div className="space-y-3">
          {accounts.map((acc) => (
            <Card key={acc.id} padding="md" className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                  <User size={18} className="text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{acc.googleEmail}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Conectado em {new Date(acc.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Badge variant="active">Conectada</Badge>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                <Link to="/calendars" className="flex-1">
                  <Button variant="ghost" size="sm" fullWidth className="justify-start">
                    <Calendar size={14} />
                    Ver agendas
                  </Button>
                </Link>
                <button
                  onClick={() => handleCopyLink()}
                  disabled={copyingLink}
                  title="Copiar link OAuth"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
                <button
                  onClick={() => handleDelete(acc.id, acc.googleEmail)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add more account link */}
      {!loading && (
        <button
          onClick={handleCopyLink}
          disabled={copyingLink}
          className="w-full flex items-center justify-center gap-2 text-sm text-brand-600 font-medium py-2 hover:underline"
        >
          <ExternalLink size={14} />
          {copyingLink ? 'Gerando link...' : 'Copiar link para conectar outra conta'}
        </button>
      )}

      <p className="text-center text-xs text-gray-400 pb-2">
        © 2024 Calendar Bridge. Seus dados são apenas seus.
      </p>
    </div>
  );
}
