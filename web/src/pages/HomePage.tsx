import { Link } from 'react-router-dom';

const steps = [
  { num: 1, title: 'Conectar Contas', desc: 'Adicione suas contas Google na aba "Contas Google"', link: '/accounts' },
  { num: 2, title: 'Ver Agendas', desc: 'Explore as agendas disponíveis em cada conta', link: '/calendars' },
  { num: 3, title: 'Criar Bridge', desc: 'Configure regras de bloqueio entre agendas', link: '/bridges' },
  { num: 4, title: 'Sincronizar', desc: 'Monitore os logs de sincronização', link: '/logs' },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="text-center py-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">📅 Calendar Bridge</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Sincronize compromissos entre múltiplas contas Google automaticamente, sem expor dados sensíveis.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {steps.map((step) => (
          <Link
            key={step.num}
            to={step.link}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-start gap-4">
              <span className="bg-blue-100 text-blue-700 font-bold text-lg rounded-full w-10 h-10 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {step.num}
              </span>
              <div>
                <h2 className="font-semibold text-gray-800">{step.title}</h2>
                <p className="text-gray-500 text-sm mt-1">{step.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-800 mb-2">Como funciona</h3>
        <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
          <li>Conecte duas ou mais contas Google</li>
          <li>Crie uma regra de bridge entre agendas</li>
          <li>Ao sincronizar, eventos ocupados da origem geram blocos "Busy" no destino</li>
          <li>Dados sensíveis nunca são copiados — só horário e título "Busy"</li>
          <li>Sync automático via GitHub Actions a cada 5–10 minutos</li>
        </ul>
      </div>
    </div>
  );
}
