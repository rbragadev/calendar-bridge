import { Link } from 'react-router-dom';
import { ArrowLeftRight, Shield, Zap, Lock, Calendar, Check, ChevronDown } from 'lucide-react';
import Button from '../components/ui/Button';

const features = [
  {
    icon: Zap,
    title: 'Sincronização Automática',
    desc: 'Seus compromissos são sincronizados automaticamente entre contas, sem intervenção manual.',
  },
  {
    icon: Shield,
    title: 'Privacidade Total',
    desc: 'Apenas horário e "Busy" são copiados. Título, descrição e participantes ficam privados.',
  },
  {
    icon: Lock,
    title: 'Criptografia E2E',
    desc: 'Tokens de acesso são criptografados com AES-256. Seus dados nunca ficam expostos.',
  },
  {
    icon: Calendar,
    title: 'Múltiplas Contas',
    desc: 'Conecte quantas contas Google quiser e crie pontes entre elas.',
  },
];

const faqs = [
  {
    q: 'O que é uma bridge?',
    a: 'Uma bridge é uma regra de sincronização entre duas agendas Google. Quando você tem um compromisso na origem, um bloco "Busy" é criado automaticamente no destino.',
  },
  {
    q: 'Meus dados ficam seguros?',
    a: 'Sim. Apenas o horário de início e fim dos eventos é copiado. Título original, descrição, participantes e outros detalhes nunca saem da sua conta de origem.',
  },
  {
    q: 'Funciona com múltiplas contas?',
    a: 'Sim. Você pode conectar quantas contas Google quiser e criar bridges entre qualquer par de agendas.',
  },
  {
    q: 'Com que frequência sincroniza?',
    a: 'A sincronização é feita automaticamente a cada 15 minutos, garantindo que seus calendários estejam sempre atualizados.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-brand-600 text-base">
            <ArrowLeftRight size={18} />
            Calendar Bridge
          </div>
          <Link to="/login">
            <Button size="sm">Começar agora</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-5 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 text-white">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm font-medium">
            <ArrowLeftRight size={14} />
            Sincronização inteligente de agendas
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Conecte suas agendas Google sem expor seus dados
          </h1>
          <p className="text-lg text-brand-200 max-w-xl mx-auto">
            Calendar Bridge sincroniza compromissos entre múltiplas contas Google automaticamente,
            bloqueando apenas o horário — sem copiar detalhes sensíveis.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/login">
              <Button size="lg" variant="primary" className="bg-white text-brand-600 hover:bg-brand-50">
                Começar gratuitamente
              </Button>
            </Link>
            <a href="#como-funciona">
              <Button size="lg" variant="ghost" className="text-white border border-white/30 hover:bg-white/10">
                Ver como funciona
                <ChevronDown size={16} />
              </Button>
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 text-sm text-brand-300 pt-2">
            <span className="flex items-center gap-1.5"><Check size={14} className="text-green-400" /> Grátis</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-green-400" /> Sem cartão</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-green-400" /> Open source</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-16 px-5 bg-brand-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">Como funciona</h2>
            <p className="text-gray-500 mt-2">Configure em minutos, sincronize para sempre.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { num: '01', title: 'Conecte suas contas', desc: 'Autorize o acesso às suas contas Google via OAuth seguro.' },
              { num: '02', title: 'Crie uma Bridge', desc: 'Selecione a agenda de origem e destino com poucos cliques.' },
              { num: '03', title: 'Sincronização automática', desc: 'Bloqueios são criados e atualizados automaticamente a cada 15 min.' },
            ].map((step) => (
              <div key={step.num} className="bg-white rounded-2xl p-5 shadow-card">
                <span className="text-3xl font-bold text-brand-200">{step.num}</span>
                <h3 className="font-semibold text-gray-900 mt-2">{step.title}</h3>
                <p className="text-sm text-gray-400 mt-1">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">Por que Calendar Bridge?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 p-5 bg-brand-50 rounded-2xl">
                <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-brand-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-5 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">Perguntas frequentes</h2>
          </div>
          <div className="space-y-4">
            {faqs.map(({ q, a }) => (
              <div key={q} className="bg-white rounded-2xl p-5 shadow-card">
                <h3 className="font-semibold text-gray-900">{q}</h3>
                <p className="text-sm text-gray-400 mt-2">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-5 bg-brand-600 text-white text-center">
        <div className="max-w-xl mx-auto space-y-4">
          <h2 className="text-2xl font-bold">Pronto para sincronizar suas agendas?</h2>
          <p className="text-brand-200">Comece agora mesmo, é grátis e sem cartão de crédito.</p>
          <Link to="/login">
            <Button size="lg" className="bg-white text-brand-600 hover:bg-brand-50 mt-2">
              Criar conta grátis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-5 border-t border-gray-100">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2 font-semibold text-gray-600">
            <ArrowLeftRight size={16} className="text-brand-600" />
            Calendar Bridge
          </div>
          <p>© 2024 Calendar Bridge. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <span className="hover:text-gray-600 cursor-pointer">Privacidade</span>
            <span className="hover:text-gray-600 cursor-pointer">Termos</span>
            <Link to="/login" className="text-brand-600 hover:underline">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
