import React from 'react';
import {
  Tv,
  Layers,
  Upload,
  PlaySquare,
  Grid,
  Sparkles,
  Smartphone,
  ExternalLink,
  Wifi,
  WifiOff,
  Maximize2,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'studio' | 'media' | 'playlist' | 'players';
  setActiveTab: (tab: 'studio' | 'media' | 'playlist' | 'players') => void;
  sseConnected: boolean;
  showAlignmentGrid: boolean;
  onToggleGrid: () => void;
  onOpenAndroidGuide: () => void;
  onLaunchTvPlayer: (screen: 'all' | 0 | 1 | 2) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  sseConnected,
  showAlignmentGrid,
  onToggleGrid,
  onOpenAndroidGuide,
  onLaunchTvPlayer,
}) => {
  const [showTvDropdown, setShowTvDropdown] = React.useState(false);

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & System Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Tv className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">WallSync</h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  Video Wall 3x1
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Digital Signage para 3 TVs Verticais</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'studio'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Studio Wall
            </button>

            <button
              onClick={() => setActiveTab('media')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'media'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Mídias & Vídeos
            </button>

            <button
              onClick={() => setActiveTab('playlist')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'playlist'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <PlaySquare className="w-3.5 h-3.5" />
              Playlist
            </button>

            <button
              onClick={() => setActiveTab('players')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'players'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Displays Android
            </button>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            {/* Real-time sync badge */}
            <div
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                sseConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
              title={sseConnected ? 'Sincronizado via WebSockets/SSE' : 'Conectando ao servidor...'}
            >
              {sseConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Ao Vivo</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Conectando</span>
                </>
              )}
            </div>

            {/* Alignment Grid Toggle */}
            <button
              onClick={onToggleGrid}
              className={`p-2 rounded-lg border transition text-xs flex items-center gap-1.5 ${
                showAlignmentGrid
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="Ativar/Desativar Grade de Teste de Alinhamento e Molduras nas TVs"
            >
              <Grid className="w-4 h-4" />
              <span className="hidden sm:inline">Grade de Teste</span>
            </button>

            {/* Android Setup Guide button */}
            <button
              onClick={onOpenAndroidGuide}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition text-xs flex items-center gap-1.5"
              title="Guia de Configuração para Android TV e Box"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Guia Android</span>
            </button>

            {/* Launch TV Player Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowTvDropdown(!showTvDropdown)}
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold rounded-lg text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Abrir Player TV</span>
              </button>

              {showTvDropdown && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 text-xs"
                  onMouseLeave={() => setShowTvDropdown(false)}
                >
                  <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Modos de Exibição na TV
                  </div>
                  <button
                    onClick={() => {
                      onLaunchTvPlayer('all');
                      setShowTvDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between"
                  >
                    <span>Unificado (3-TVs em 1 Canvas)</span>
                    <ExternalLink className="w-3 h-3 text-emerald-400" />
                  </button>
                  <div className="border-t border-slate-800 my-1" />
                  <button
                    onClick={() => {
                      onLaunchTvPlayer(0);
                      setShowTvDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-slate-300 flex items-center justify-between"
                  >
                    <span>TV 1 (Esquerda)</span>
                    <span className="text-[10px] text-slate-500">Display 0</span>
                  </button>
                  <button
                    onClick={() => {
                      onLaunchTvPlayer(1);
                      setShowTvDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-slate-300 flex items-center justify-between"
                  >
                    <span>TV 2 (Centro)</span>
                    <span className="text-[10px] text-slate-500">Display 1</span>
                  </button>
                  <button
                    onClick={() => {
                      onLaunchTvPlayer(2);
                      setShowTvDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-slate-300 flex items-center justify-between"
                  >
                    <span>TV 3 (Direita)</span>
                    <span className="text-[10px] text-slate-500">Display 2</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-3 py-1 rounded-md ${activeTab === 'studio' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            Studio Wall
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`px-3 py-1 rounded-md ${activeTab === 'media' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            Mídias
          </button>
          <button
            onClick={() => setActiveTab('playlist')}
            className={`px-3 py-1 rounded-md ${activeTab === 'playlist' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            Playlist
          </button>
          <button
            onClick={() => setActiveTab('players')}
            className={`px-3 py-1 rounded-md ${activeTab === 'players' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            Android
          </button>
        </div>
      </div>
    </header>
  );
};
