import React from 'react';
import { AppState, VideoWallConfig, Playlist, MediaItem, PlayerDevice } from './types';
import { Header } from './components/Header';
import { VideoWallStudio } from './components/VideoWallStudio';
import { MediaLibrary } from './components/MediaLibrary';
import { PlaylistManager } from './components/PlaylistManager';
import { PlayerManager } from './components/PlayerManager';
import { TvPlayerView } from './components/TvPlayerView';
import { AndroidGuideModal } from './components/AndroidGuideModal';
import { DEFAULT_APP_STATE } from './data/sampleData';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const [isTvMode, setIsTvMode] = React.useState<boolean>(false);
  const [tvScreenIndex, setTvScreenIndex] = React.useState<'all' | 0 | 1 | 2>('all');

  const [appState, setAppState] = React.useState<AppState | null>(null);
  const [activeTab, setActiveTab] = React.useState<'studio' | 'media' | 'playlist' | 'players'>(() => {
    return (sessionStorage.getItem('wallsync_active_tab') as any) || 'studio';
  });
  const [sseConnected, setSseConnected] = React.useState<boolean>(false);
  const [showAndroidGuide, setShowAndroidGuide] = React.useState<boolean>(false);

  // Sync activeTab to sessionStorage
  React.useEffect(() => {
    sessionStorage.setItem('wallsync_active_tab', activeTab);
  }, [activeTab]);

  // Check URL parameters for TV Mode (?mode=tv&screen=0)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const screen = params.get('screen');

    if (mode === 'tv') {
      setIsTvMode(true);
      if (screen === '0') setTvScreenIndex(0);
      else if (screen === '1') setTvScreenIndex(1);
      else if (screen === '2') setTvScreenIndex(2);
      else setTvScreenIndex('all');
    }
  }, []);

  // Load initial app state & listen to SSE stream
  React.useEffect(() => {
    if (isTvMode) return; // TV mode handles its own fetch/SSE

    let isMounted = true;
    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setAppState((prev) => prev || DEFAULT_APP_STATE);
      }
    }, 1500);

    // Initial state fetch
    fetch('/api/state')
      .then((res) => res.json())
      .then((resData) => {
        if (isMounted) {
          if (resData.success && resData.data) {
            setAppState(resData.data);
          } else {
            setAppState((prev) => prev || DEFAULT_APP_STATE);
          }
        }
      })
      .catch((err) => {
        console.warn('Erro ao buscar estado inicial (usando estado local de fallback):', err);
        if (isMounted) {
          setAppState((prev) => prev || DEFAULT_APP_STATE);
        }
      })
      .finally(() => clearTimeout(fallbackTimer));

    // Connect SSE
    const eventSource = new EventSource('/api/sse');

    eventSource.onopen = () => {
      setSseConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.state && isMounted) {
          setAppState(payload.state);
        }
      } catch (err) {
        console.error('Erro ao decodificar evento SSE:', err);
      }
    };

    eventSource.onerror = () => {
      setSseConnected(false);
    };

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      eventSource.close();
    };
  }, [isTvMode]);

  // Handler to launch TV player in a new tab
  const handleLaunchTvPlayer = (screen: 'all' | 0 | 1 | 2) => {
    const url = `${window.location.origin}/?mode=tv&screen=${screen}`;
    window.open(url, '_blank');
  };

  // API Mutators
  const handleUpdateWallConfig = async (newConfig: VideoWallConfig) => {
    if (!appState) return;
    setAppState((prev) => (prev ? { ...prev, wallConfig: newConfig } : null));

    try {
      await fetch('/api/wall-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
    } catch (err) {
      console.error('Erro ao atualizar wall config:', err);
    }
  };

  const handleSelectActiveMedia = async (mediaId: string) => {
    if (!appState) return;
    setAppState((prev) => (prev ? { ...prev, activeMediaId: mediaId } : null));

    try {
      await fetch('/api/playback/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId }),
      });
    } catch (err) {
      console.error('Erro ao definir mídia ativa:', err);
    }
  };

  const handleToggleGrid = async () => {
    if (!appState) return;
    const nextVal = !appState.showAlignmentGrid;
    setAppState((prev) => (prev ? { ...prev, showAlignmentGrid: nextVal } : null));

    try {
      await fetch('/api/playback/grid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextVal }),
      });
    } catch (err) {
      console.error('Erro ao alternar grade:', err);
    }
  };

  const handleUploadMedia = async (file: File, title: string, duration: number) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('duration', duration.toString());
    formData.append('addToPlaylist', 'true');

    const res = await fetch('/api/media/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'Falha ao fazer upload da mídia');
    }
  };

  const handleDeleteMedia = async (id: string) => {
    try {
      await fetch(`/api/media/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Erro ao excluir mídia:', err);
    }
  };

  const handleUpdatePlaylist = async (newPlaylist: Playlist) => {
    if (!appState) return;
    setAppState((prev) => (prev ? { ...prev, playlist: newPlaylist } : null));

    try {
      await fetch('/api/playlist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlaylist),
      });
    } catch (err) {
      console.error('Erro ao atualizar playlist:', err);
    }
  };

  const handleAddToPlaylist = (mediaId: string) => {
    if (!appState) return;
    const media = appState.mediaItems.find((m) => m.id === mediaId);
    if (!media) return;

    const newItem = {
      id: 'item_' + Date.now(),
      mediaId,
      durationSeconds: media.duration || 10,
      transition: 'fade' as const,
      enabled: true,
    };

    const newPlaylist = {
      ...appState.playlist,
      items: [...appState.playlist.items, newItem],
    };

    handleUpdatePlaylist(newPlaylist);
  };

  const handleUpdatePlayer = async (playerId: string, updates: Partial<PlayerDevice>) => {
    try {
      await fetch(`/api/players/${playerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error('Erro ao atualizar player:', err);
    }
  };

  const handleTogglePlayback = async () => {
    if (!appState) return;
    const nextVal = !appState.isPlaying;
    setAppState((prev) => (prev ? { ...prev, isPlaying: nextVal } : null));

    try {
      await fetch('/api/playback/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playing: nextVal }),
      });
    } catch (err) {
      console.error('Erro ao alternar reprodução:', err);
    }
  };

  const handleNextMedia = async () => {
    try {
      await fetch('/api/playback/next', { method: 'POST' });
    } catch (err) {
      console.error('Erro ao avançar mídia:', err);
    }
  };

  const handlePrevMedia = async () => {
    try {
      await fetch('/api/playback/prev', { method: 'POST' });
    } catch (err) {
      console.error('Erro ao voltar mídia:', err);
    }
  };

  // Render TV Player view directly if in TV Mode
  if (isTvMode) {
    return <TvPlayerView screenIndex={tvScreenIndex} />;
  }

  // Loading state
  if (!appState) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8">
        <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
        <h2 className="text-xl font-bold">Carregando WallSync Digital Signage...</h2>
        <p className="text-xs text-slate-500 mt-1">Conectando ao estúdio do Video Wall</p>
      </div>
    );
  }

  const activeMedia = appState.mediaItems.find((m) => m.id === appState.activeMediaId) || appState.mediaItems[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sseConnected={sseConnected}
        showAlignmentGrid={appState.showAlignmentGrid}
        onToggleGrid={handleToggleGrid}
        onOpenAndroidGuide={() => setShowAndroidGuide(true)}
        onLaunchTvPlayer={handleLaunchTvPlayer}
      />

      {/* Main Content View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'studio' && (
          <VideoWallStudio
            wallConfig={appState.wallConfig}
            onUpdateWallConfig={handleUpdateWallConfig}
            activeMedia={activeMedia}
            mediaItems={appState.mediaItems}
            onSelectActiveMedia={handleSelectActiveMedia}
            showAlignmentGrid={appState.showAlignmentGrid}
            onToggleGrid={handleToggleGrid}
          />
        )}

        {activeTab === 'media' && (
          <MediaLibrary
            mediaItems={appState.mediaItems}
            activeMediaId={appState.activeMediaId}
            onSelectActiveMedia={handleSelectActiveMedia}
            onUploadMedia={handleUploadMedia}
            onDeleteMedia={handleDeleteMedia}
            onAddToPlaylist={handleAddToPlaylist}
          />
        )}

        {activeTab === 'playlist' && (
          <PlaylistManager
            playlist={appState.playlist}
            mediaItems={appState.mediaItems}
            activeMediaId={appState.activeMediaId}
            isPlaying={appState.isPlaying}
            onUpdatePlaylist={handleUpdatePlaylist}
            onSelectActiveMedia={handleSelectActiveMedia}
            onTogglePlayback={handleTogglePlayback}
            onNextMedia={handleNextMedia}
            onPrevMedia={handlePrevMedia}
          />
        )}

        {activeTab === 'players' && (
          <PlayerManager
            players={appState.players}
            onUpdatePlayer={handleUpdatePlayer}
            onOpenAndroidGuide={() => setShowAndroidGuide(true)}
            onLaunchTvPlayer={handleLaunchTvPlayer}
          />
        )}
      </main>

      {/* Android Installation Modal */}
      <AndroidGuideModal isOpen={showAndroidGuide} onClose={() => setShowAndroidGuide(false)} />
    </div>
  );
}
