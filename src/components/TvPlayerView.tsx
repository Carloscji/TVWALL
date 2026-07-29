import React from 'react';
import { AppState, MediaItem } from '../types';
import { getGlobalTransformStyle, getScreenSliceTransform } from '../lib/videoWallUtils';
import { DEFAULT_APP_STATE } from '../data/sampleData';
import { Tv, Grid, Wifi, RefreshCw, Settings, Maximize2, ShieldCheck, Check, Server } from 'lucide-react';
import { SmartVideoPlayer } from './SmartVideoPlayer';

interface TvPlayerViewProps {
  screenIndex: 'all' | 0 | 1 | 2;
  initialState?: AppState;
}

export const TvPlayerView: React.FC<TvPlayerViewProps> = ({ screenIndex: initialScreenIndex, initialState }) => {
  // Load saved config or defaults
  const [serverUrl, setServerUrl] = React.useState<string>(() => {
    return localStorage.getItem('wallsync_server_url') || window.location.origin;
  });
  const [screenIndex, setScreenIndex] = React.useState<'all' | 0 | 1 | 2>(() => {
    const saved = localStorage.getItem('wallsync_target_screen');
    if (saved === 'all') return 'all';
    if (saved === '0') return 0;
    if (saved === '1') return 1;
    if (saved === '2') return 2;
    return initialScreenIndex;
  });

  const [appState, setAppState] = React.useState<AppState | null>(initialState || null);
  const [connectionStatus, setConnectionStatus] = React.useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [showConfigModal, setShowConfigModal] = React.useState<boolean>(false);
  const [showInfoOverlay, setShowInfoOverlay] = React.useState<boolean>(false);
  const [retryCount, setRetryCount] = React.useState<number>(0);

  const [tempServerUrl, setTempServerUrl] = React.useState<string>(serverUrl);

  // Transition state
  const [currentMedia, setCurrentMedia] = React.useState<MediaItem | null>(null);
  const [previousMedia, setPreviousMedia] = React.useState<MediaItem | null>(null);
  const [transitionType, setTransitionType] = React.useState<'fade' | 'slide' | 'zoom' | 'none'>('fade');

  // React to appState changes and manage smooth media transition
  React.useEffect(() => {
    if (!appState) return;
    const { mediaItems, activeMediaId, playlist, currentPlayIndex } = appState;
    const newMedia = mediaItems.find((m) => m.id === activeMediaId) || mediaItems[0];
    if (!newMedia) return;

    const items = playlist.items.filter((i) => i.enabled !== false);
    const currentItem = items[currentPlayIndex || 0] || items.find((i) => i.mediaId === activeMediaId);
    const type = currentItem?.transition || 'fade';
    setTransitionType(type);

    if (currentMedia && currentMedia.id !== newMedia.id) {
      if (type === 'none') {
        setCurrentMedia(newMedia);
        setPreviousMedia(null);
      } else {
        setPreviousMedia(currentMedia);
        setCurrentMedia(newMedia);

        const timer = setTimeout(() => {
          setPreviousMedia(null);
        }, 750);
        return () => clearTimeout(timer);
      }
    } else if (!currentMedia) {
      setCurrentMedia(newMedia);
    }
  }, [appState?.activeMediaId, appState?.currentPlayIndex, appState?.mediaItems]);

  // Keyboard shortcuts ('I' for info, 'C' or 'S' for config, 'F' for fullscreen)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'i' || e.key === 'I') {
        setShowInfoOverlay((prev) => !prev);
      }
      if (e.key === 'c' || e.key === 'C' || e.key === 's' || e.key === 'S') {
        setShowConfigModal((prev) => !prev);
      }
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => console.warn('Erro ao entrar em tela cheia:', e));
    } else {
      document.exitFullscreen().catch((e) => console.warn('Erro ao sair da tela cheia:', e));
    }
  };

  const saveConfiguration = (newUrl: string, newScreen: 'all' | 0 | 1 | 2) => {
    const cleanedUrl = newUrl.trim().replace(/\/$/, '');
    localStorage.setItem('wallsync_server_url', cleanedUrl);
    localStorage.setItem('wallsync_target_screen', newScreen.toString());
    setServerUrl(cleanedUrl);
    setScreenIndex(newScreen);
    setShowConfigModal(false);
    setConnectionStatus('connecting');
  };

  // Fetch initial state & connect to SSE real-time stream from configured serverUrl
  React.useEffect(() => {
    let isMounted = true;
    let eventSource: EventSource | null = null;
    let pollTimer: NodeJS.Timeout | null = null;

    const base = serverUrl.replace(/\/$/, '');

    const checkConnectionAndFetchState = () => {
      fetch(`${base}/api/state`)
        .then((res) => res.json())
        .then((data) => {
          if (isMounted) {
            if (data.success && data.data) {
              setAppState(data.data);
              setConnectionStatus('connected');
            } else {
              setAppState((prev) => prev || DEFAULT_APP_STATE);
              setConnectionStatus('connected');
            }
          }
        })
        .catch((err) => {
          console.warn(`Tentativa de conexão com o servidor ${base} falhou:`, err);
          if (isMounted) {
            setRetryCount((c) => c + 1);
            setConnectionStatus('disconnected');
            // Ensure appState fallback is loaded if none exists
            setAppState((prev) => prev || DEFAULT_APP_STATE);
          }
        });
    };

    // Initial check
    checkConnectionAndFetchState();

    // SSE Stream setup
    try {
      eventSource = new EventSource(`${base}/api/sse`);

      eventSource.onopen = () => {
        if (isMounted) setConnectionStatus('connected');
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.state && isMounted) {
            setAppState(payload.state);
            setConnectionStatus('connected');
          }
        } catch (err) {
          console.error('Erro ao processar mensagem SSE:', err);
        }
      };

      eventSource.onerror = () => {
        if (isMounted) {
          setConnectionStatus('disconnected');
        }
      };
    } catch (e) {
      console.warn('Erro ao inicializar SSE EventSource:', e);
    }

    // Auto reconnect retry timer every 5 seconds silently
    pollTimer = setInterval(() => {
      if (connectionStatus === 'disconnected') {
        checkConnectionAndFetchState();
      }
    }, 5000);

    return () => {
      isMounted = false;
      if (eventSource) eventSource.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [serverUrl]);

  // Heartbeat Ping to Server
  React.useEffect(() => {
    const base = serverUrl.replace(/\/$/, '');
    const pingInterval = setInterval(() => {
      fetch(`${base}/api/players/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenIndex,
          pairingCode: `TV-${screenIndex.toString().toUpperCase()}`,
        }),
      }).catch((e) => console.warn('Ping error:', e));
    }, 10000);

    return () => clearInterval(pingInterval);
  }, [serverUrl, screenIndex]);

  // Handle video ended event to request next playlist item
  const handleVideoEnded = () => {
    const base = serverUrl.replace(/\/$/, '');
    fetch(`${base}/api/playback/next`, { method: 'POST' }).catch((e) =>
      console.warn('Erro ao disparar próxima mídia no fim do vídeo:', e)
    );
  };

  // Client-side local rotation timer fallback (in case server is offline)
  React.useEffect(() => {
    if (!appState || !appState.isPlaying) return;

    const items = appState.playlist.items.filter((item) => item.enabled !== false);
    if (items.length <= 1) return;

    const currentItem = items[appState.currentPlayIndex || 0] || items[0];
    const durationMs = Math.max(3, currentItem.durationSeconds || 10) * 1000;

    const timer = setTimeout(() => {
      const base = serverUrl.replace(/\/$/, '');
      fetch(`${base}/api/playback/next`, { method: 'POST' }).catch(() => {
        // Local offline rotation fallback if server request fails
        setAppState((prev) => {
          if (!prev) return null;
          const nextIdx = ((prev.currentPlayIndex || 0) + 1) % items.length;
          const nextItem = items[nextIdx];
          return {
            ...prev,
            currentPlayIndex: nextIdx,
            activeMediaId: nextItem ? nextItem.mediaId : prev.activeMediaId,
          };
        });
      });
    }, durationMs + 500);

    return () => clearTimeout(timer);
  }, [appState?.activeMediaId, appState?.isPlaying, appState?.currentPlayIndex, serverUrl]);

  const screenName =
    screenIndex === 'all'
      ? 'Video Wall Unificado (3-TVs)'
      : `TV ${screenIndex + 1} (${screenIndex === 0 ? 'Esquerda' : screenIndex === 1 ? 'Centro' : 'Direita'})`;

  // Render waiting / connection setup screen ONLY if appState has not loaded at all
  if (!appState) {
    return (
      <div className="fixed inset-0 bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans select-none">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 animate-pulse" />

          {/* Logo Icon */}
          <div className="relative mx-auto w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center shadow-inner">
            <Tv className="w-10 h-10" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border-2 border-slate-900 animate-ping" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-100">WallSync Player TV Box</h2>
            <p className="text-xs text-amber-400 font-medium mt-1 flex items-center justify-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Conectando ao Servidor ({serverUrl})
            </p>
          </div>

          {/* Server URL Config box */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-400" /> Endereço do Servidor Web:
              </span>
            </div>
            <input
              type="text"
              value={tempServerUrl}
              onChange={(e) => setTempServerUrl(e.target.value)}
              placeholder="Ex: http://192.168.1.150:3000"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => saveConfiguration(tempServerUrl, screenIndex)}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition"
              >
                Conectar Agora
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
            <button
              onClick={toggleFullscreen}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition flex items-center gap-1.5"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Modo Tela Cheia (Kiosk)</span>
            </button>
            <span className="text-[11px] text-slate-500">{screenName}</span>
          </div>
        </div>
      </div>
    );
  }

  const { wallConfig, mediaItems, playlist, activeMediaId, showAlignmentGrid } = appState;
  const activeMedia = currentMedia || mediaItems.find((m) => m.id === activeMediaId) || mediaItems[0];

  const fitClass =
    wallConfig.globalTransform.fitMode === 'cover'
      ? 'w-full h-full object-cover'
      : wallConfig.globalTransform.fitMode === 'stretch'
      ? 'w-full h-full object-fill'
      : 'max-w-full max-h-full object-contain';

  const renderMediaElement = (media: MediaItem, isOutgoing = false) => {
    const isVid = media.type === 'video';

    let transitionStyle = 'transition-all duration-700 ease-in-out';
    if (transitionType === 'fade') {
      transitionStyle += isOutgoing ? ' opacity-0' : ' opacity-100';
    } else if (transitionType === 'slide') {
      transitionStyle += isOutgoing ? ' -translate-x-full opacity-0' : ' translate-x-0 opacity-100';
    } else if (transitionType === 'zoom') {
      transitionStyle += isOutgoing ? ' scale-110 opacity-0' : ' scale-100 opacity-100';
    } else {
      transitionStyle += ' opacity-100';
    }

    return (
      <div
        key={`${media.id}_${isOutgoing ? 'out' : 'in'}`}
        className={`absolute inset-0 w-full h-full flex items-center justify-center ${transitionStyle}`}
      >
        {isVid ? (
          <SmartVideoPlayer
            src={media.url}
            fitClass={fitClass}
            onEnded={handleVideoEnded}
            onError={handleVideoEnded}
          />
        ) : (
          <img src={media.url} alt="" className={`max-w-none ${fitClass}`} />
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none cursor-none font-sans">
      {/* Floating discreet config trigger button (visible on hover / tap) */}
      <div className="fixed top-4 right-4 z-50 opacity-20 hover:opacity-100 transition-opacity flex items-center gap-2">
        <button
          onClick={toggleFullscreen}
          className="p-2 bg-slate-900/90 text-white border border-slate-800 rounded-xl shadow-xl hover:bg-slate-800"
          title="Alternar Tela Cheia"
        >
          <Maximize2 className="w-4 h-4 text-emerald-400" />
        </button>
        <button
          onClick={() => {
            setTempServerUrl(serverUrl);
            setShowConfigModal(true);
          }}
          className="p-2 bg-slate-900/90 text-white border border-slate-800 rounded-xl shadow-xl hover:bg-slate-800"
          title="Configurações do Player"
        >
          <Settings className="w-4 h-4 text-slate-300" />
        </button>
      </div>

      {/* Main Video Wall Container */}
      <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
        {/* Render Sliced Canvas based on screenIndex */}
        <div
          className="w-full h-full relative overflow-hidden flex items-center justify-center"
          style={getScreenSliceTransform(screenIndex, wallConfig)}
        >
          {/* Global Transform Wrapper */}
          <div
            className="w-full h-full relative flex items-center justify-center"
            style={getGlobalTransformStyle(wallConfig.globalTransform)}
          >
            {/* Outgoing media element during cross-fade */}
            {previousMedia && renderMediaElement(previousMedia, true)}

            {/* Current active media element */}
            {activeMedia ? (
              renderMediaElement(activeMedia, false)
            ) : (
              <div className="text-slate-700 text-xl font-bold">Sem Mídia em Exibição</div>
            )}
          </div>
        </div>

        {/* Alignment Grid Overlay if enabled */}
        {showAlignmentGrid && (
          <div className="absolute inset-0 z-40 pointer-events-none border-4 border-cyan-400 grid grid-cols-6 grid-rows-6">
            <div className="col-span-6 row-span-6 border-2 border-dashed border-cyan-400/60 flex items-center justify-center">
              <div className="bg-slate-950/90 text-cyan-300 border-2 border-cyan-400 px-6 py-3 rounded-2xl text-2xl font-mono font-bold shadow-2xl">
                {screenName} - ALINHAMENTO DE MOLDURA
              </div>
            </div>
            <div className="absolute inset-0 border-t-2 border-b-2 border-cyan-400/80 top-1/2 -translate-y-1/2" />
            <div className="absolute inset-0 border-l-2 border-r-2 border-cyan-400/80 left-1/2 -translate-x-1/2" />
          </div>
        )}

        {/* Info Overlay (Toggle with key 'I') */}
        {showInfoOverlay && (
          <div className="absolute bottom-6 left-6 z-50 bg-slate-950/90 backdrop-blur-md border border-slate-800 p-4 rounded-2xl text-white shadow-2xl text-xs space-y-2 max-w-md">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Tv className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-sm">{screenName}</h3>
                <p className="text-[10px] text-slate-400">Servidor: {serverUrl}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div>
                <span className="text-slate-500">Mídia no Ar:</span>
                <p className="font-bold text-emerald-400 truncate">{activeMedia?.name}</p>
              </div>
              <div>
                <span className="text-slate-500">Status SSE:</span>
                <p className="font-bold text-emerald-400">{connectionStatus === 'connected' ? 'Conectado 24/7' : 'Reconectando...'}</p>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800 flex justify-between">
              <span>Pressione 'I' para ocultar | 'C' para configurações</span>
              <span className="text-emerald-400 font-bold">Modo Kiosk Ativo</span>
            </div>
          </div>
        )}

        {/* Configuration Modal on TV */}
        {showConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 text-slate-100 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                  <Settings className="w-5 h-5" /> Configurações do Player Android / TV Box
                </div>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="text-slate-400 hover:text-white text-xs px-3 py-1 bg-slate-800 rounded-lg"
                >
                  Fechar ✕
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">URL do Servidor WallSync:</label>
                  <input
                    type="text"
                    value={tempServerUrl}
                    onChange={(e) => setTempServerUrl(e.target.value)}
                    placeholder="http://192.168.1.150:3000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Defina o IP da máquina na rede local onde o servidor WallSync está rodando.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Qual Tela este TV Box representa?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'all', label: 'Video Wall Unificado (3-in-1)' },
                      { id: 0, label: 'TV 1 (Esquerda)' },
                      { id: 1, label: 'TV 2 (Centro)' },
                      { id: 2, label: 'TV 3 (Direita)' },
                    ].map((opt) => (
                      <button
                        key={opt.id.toString()}
                        onClick={() => saveConfiguration(tempServerUrl, opt.id as any)}
                        className={`p-2.5 rounded-xl border font-semibold text-left transition ${
                          screenIndex === opt.id
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                  <button
                    onClick={toggleFullscreen}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition flex items-center gap-1.5"
                  >
                    <Maximize2 className="w-4 h-4 text-emerald-400" />
                    <span>Entrar em Tela Cheia</span>
                  </button>

                  <button
                    onClick={() => saveConfiguration(tempServerUrl, screenIndex)}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>Salvar e Aplicar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

