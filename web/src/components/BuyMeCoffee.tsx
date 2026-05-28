import { useState } from 'react';
import { Copy, Check, Coffee } from 'lucide-react';

const PIX_KEY = 'raffael.info@gmail.com';

export default function BuyMeCoffee() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-5">
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 text-8xl opacity-10 select-none pointer-events-none">
        ☕
      </div>

      <div className="relative space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center text-lg shrink-0">
            ☕
          </div>
          <div>
            <h3 className="font-bold text-amber-900 text-sm">Me paga um café?</h3>
            <p className="text-xs text-amber-700">
              O app é grátis, mas o café não. 😅
            </p>
          </div>
        </div>

        <p className="text-xs text-amber-800 leading-relaxed">
          Se o Calendar Bridge te salvou de uma reunião dupla, que tal um cafezinho?
          Qualquer valor já garante mais horas de código e menos reuniões perdidas. ☕🙏
        </p>

        {/* Pix section */}
        <div className="bg-white/70 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-amber-900 uppercase tracking-wide">Pix</span>
            <span className="text-xs bg-green-100 text-green-700 font-medium px-1.5 py-0.5 rounded-full">Chave e-mail</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-amber-900 font-mono bg-amber-50 rounded-lg px-3 py-2 border border-amber-100 truncate">
              {PIX_KEY}
            </code>
            <button
              onClick={handleCopy}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shrink-0 ${
                copied
                  ? 'bg-green-100 text-green-600'
                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              }`}
              title="Copiar chave Pix"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
          {copied && (
            <p className="text-xs text-green-600 font-medium text-center animate-pulse">
              Chave copiada! Obrigado! ☕❤️
            </p>
          )}
        </div>

        <p className="text-[11px] text-amber-600 text-center">
          Feito com ☕ + 💻 + muito Stack Overflow
        </p>
      </div>
    </div>
  );
}
