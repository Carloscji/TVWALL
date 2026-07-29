import React from 'react';
import { Tv, Smartphone, QrCode, Copy, Check, ExternalLink, ShieldCheck, Zap, Layers, RefreshCw } from 'lucide-react';

interface AndroidGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl?: string;
}

export const AndroidGuideModal: React.FC<AndroidGuideModalProps> = ({ isOpen, onClose, appUrl }) => {
  const [copied, setCopied] = React.useState(false);
  const currentOrigin = window.location.origin;
  const playerBaseUrl = `${currentOrigin}/?mode=tv`;

  if (!isOpen) return null;

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 text-slate-100 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Guia de Instalação no Android / Android TV</h2>
              <p className="text-xs text-slate-400">Como transformar suas TVs e Android Boxes em players de Video Wall 24/7</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition text-sm"
          >
            Fechar ✕
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Quick Links Section */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4" /> URLs do Player para o Navegador da TV
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
                <div className="font-medium text-slate-200 mb-1 flex justify-between">
                  <span>Modo Unificado (3 TVs em 1)</span>
                  <span className="text-emerald-400 font-mono">?mode=tv&screen=all</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800 text-slate-300 font-mono text-[11px] overflow-hidden truncate">
                  <span className="truncate flex-1">{`${playerBaseUrl}&screen=all`}</span>
                  <button
                    onClick={() => copyUrl(`${playerBaseUrl}&screen=all`)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                    title="Copiar URL"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
                <div className="font-medium text-slate-200 mb-1 flex justify-between">
                  <span>Modo Multi-Dispositivo (TV 1 / 2 / 3)</span>
                  <span className="text-cyan-400 font-mono">?mode=tv&screen=0</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800 text-slate-300 font-mono text-[11px] overflow-hidden truncate">
                  <span className="truncate flex-1">{`${playerBaseUrl}&screen=0`}</span>
                  <button
                    onClick={() => copyUrl(`${playerBaseUrl}&screen=0`)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                    title="Copiar URL"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Steps list */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" /> Duas Formas de Rodar no TV Box (Sem Navegador Visível)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Option A: APK Direct Web2App */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Smartphone className="w-4 h-4" /> Opção 1: Criar APK Nativo (Web2APK / PWABuilder)
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed">
                  <li>
                    Acesse o site <span className="text-emerald-300 font-semibold">pwabuilder.com</span> ou use o app <span className="text-emerald-300 font-semibold">Web2APK</span>.
                  </li>
                  <li>
                    Cole a URL do Player: <code className="text-emerald-400 font-mono text-[11px]">{`${playerBaseUrl}&screen=0`}</code>.
                  </li>
                  <li>
                    Gere e baixe o arquivo <span className="text-white font-semibold font-mono">.APK</span> gerado.
                  </li>
                  <li>
                    Instale o APK no seu TV Box via Pendrive e ative a opção <span className="text-emerald-300 font-medium">"Autostart on Boot"</span> em um app gerenciador como o <i>Launch on Boot</i> ou <i>Autostart Flow</i>.
                  </li>
                </ol>
                <div className="p-2.5 bg-slate-900 rounded-lg text-[11px] text-slate-400 border border-slate-800">
                  ⚡ O APK abrirá o WallSync diretamente em tela cheia na inicialização do TV Box, aguardando o servidor conectar automaticamente!
                </div>
              </div>

              {/* Option B: Fully Kiosk App */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <Tv className="w-4 h-4" /> Opção 2: Fully Kiosk Browser (Recomendado 24/7)
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed">
                  <li>
                    Instale o APK do <span className="text-cyan-300 font-semibold">Fully Kiosk Browser</span> no TV Box.
                  </li>
                  <li>
                    Defina a <span className="text-cyan-300 font-medium">Start URL</span> com o IP do servidor (Ex: <code className="text-cyan-300 font-mono text-[11px]">{`${playerBaseUrl}&screen=0`}</code>).
                  </li>
                  <li>
                    Marque as opções: <span className="text-cyan-300 font-medium">"Autostart on Boot"</span> e <span className="text-cyan-300 font-medium">"Kiosk Mode"</span>.
                  </li>
                  <li>
                    Ative <span className="text-cyan-300 font-medium">"Enable Screen Saver"</span> e desative a barra de status.
                  </li>
                </ol>
                <div className="p-2.5 bg-slate-900 rounded-lg text-[11px] text-slate-400 border border-slate-800">
                  🛡️ Ideal para operação comercial contínua sem que ninguém feche ou saia do aplicativo por engano.
                </div>
              </div>
            </div>
          </div>

          {/* Android PWA info */}
          <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <span className="font-semibold text-emerald-300">Suporte a PWA (Web App Instalável):</span>
              <p>
                No navegador Chrome do Android, você também pode clicar no menu de 3 pontos e selecionar <span className="text-white font-medium">"Adicionar à Tela Inicial"</span>. O software será instalado como um aplicativo nativo Android e rodará em modo tela cheia.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 border-t border-slate-800 pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-xl text-sm transition"
          >
            Entendido, Voltar ao Studio
          </button>
        </div>
      </div>
    </div>
  );
};
