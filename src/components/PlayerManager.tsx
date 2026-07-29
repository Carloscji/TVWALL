import React from 'react';
import { PlayerDevice } from '../types';
import {
  Tv,
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
  Info,
  QrCode,
  Check,
} from 'lucide-react';

interface PlayerManagerProps {
  players: PlayerDevice[];
  onUpdatePlayer: (playerId: string, updates: Partial<PlayerDevice>) => void;
  onOpenAndroidGuide: () => void;
  onLaunchTvPlayer: (screen: 'all' | 0 | 1 | 2) => void;
}

export const PlayerManager: React.FC<PlayerManagerProps> = ({
  players,
  onUpdatePlayer,
  onOpenAndroidGuide,
  onLaunchTvPlayer,
}) => {
  const [identifyingId, setIdentifyingId] = React.useState<string | null>(null);

  const triggerIdentify = (id: string) => {
    setIdentifyingId(id);
    setTimeout(() => setIdentifyingId(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Dispositivos & Android Players Conectados</h2>
            <p className="text-xs text-slate-400">
              Gerencie suas TVs, Android TV Boxes e mini PCs sincronizados em tempo real
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAndroidGuide}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-500/20 shrink-0"
        >
          <QrCode className="w-4 h-4" />
          <span>Guia de Instalação Android</span>
        </button>
      </div>

      {/* Players List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {players.map((player) => {
          const isOnline = player.status === 'online';

          return (
            <div
              key={player.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                      }`}
                    />
                    <h3 className="text-sm font-bold text-slate-100">{player.name}</h3>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      isOnline
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {isOnline ? 'Online / Ativo' : 'Offline'}
                  </span>
                </div>

                {/* Player details */}
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-500">Código de Emparelhamento:</span>
                    <span className="font-mono font-bold text-emerald-400">{player.pairingCode}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-500">Função da Tela no Wall:</span>
                    <select
                      value={player.screenIndex}
                      onChange={(e) => {
                        const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                        onUpdatePlayer(player.id, { screenIndex: val as any });
                      }}
                      className="bg-slate-950 border border-slate-800 text-slate-200 rounded px-2 py-0.5 text-xs font-semibold focus:outline-none"
                    >
                      <option value="all">Unificado (3 TVs em 1)</option>
                      <option value="0">TV 1 (Esquerda - Display 0)</option>
                      <option value="1">TV 2 (Centro - Display 1)</option>
                      <option value="2">TV 3 (Direita - Display 2)</option>
                    </select>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-500">Endereço IP:</span>
                    <span className="font-mono text-slate-400">{player.ipAddress || '192.168.1.100'}</span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Navegador / Sistema:</span>
                    <span className="truncate max-w-[200px] text-slate-400">{player.userAgent}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-800 text-xs">
                <button
                  onClick={() => triggerIdentify(player.id)}
                  className="flex-1 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition font-semibold flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  {identifyingId === player.id ? 'Identificando na TV...' : 'Identificar Tela'}
                </button>

                <button
                  onClick={() =>
                    onLaunchTvPlayer(
                      player.screenIndex === 'all' ? 'all' : (player.screenIndex as any)
                    )
                  }
                  className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl transition font-semibold flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
