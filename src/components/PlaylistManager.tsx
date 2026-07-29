import React from 'react';
import { Playlist, MediaItem, PlaylistItem } from '../types';
import {
  PlaySquare,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Trash2,
  MoveUp,
  MoveDown,
  Clock,
  Sparkles,
  Layers,
  Repeat,
  Check,
  Zap,
} from 'lucide-react';

interface PlaylistManagerProps {
  playlist: Playlist;
  mediaItems: MediaItem[];
  activeMediaId?: string;
  isPlaying?: boolean;
  onUpdatePlaylist: (newPlaylist: Playlist) => void;
  onSelectActiveMedia: (mediaId: string) => void;
  onTogglePlayback?: () => void;
  onNextMedia?: () => void;
  onPrevMedia?: () => void;
}

export const PlaylistManager: React.FC<PlaylistManagerProps> = ({
  playlist,
  mediaItems,
  activeMediaId,
  isPlaying = true,
  onUpdatePlaylist,
  onSelectActiveMedia,
  onTogglePlayback,
  onNextMedia,
  onPrevMedia,
}) => {
  // Helper to reorder playlist items
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...playlist.items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    onUpdatePlaylist({
      ...playlist,
      items: newItems,
      updatedAt: new Date().toISOString(),
    });
  };

  // Helper to update individual playlist item properties
  const updateItem = (itemId: string, updates: Partial<PlaylistItem>) => {
    const newItems = playlist.items.map((item) => (item.id === itemId ? { ...item, ...updates } : item));
    onUpdatePlaylist({
      ...playlist,
      items: newItems,
      updatedAt: new Date().toISOString(),
    });
  };

  // Helper to delete an item from playlist
  const removeItem = (itemId: string) => {
    const newItems = playlist.items.filter((item) => item.id !== itemId);
    onUpdatePlaylist({
      ...playlist,
      items: newItems,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <PlaySquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{playlist.name}</h2>
            <p className="text-xs text-slate-400">
              {playlist.items.length} itens na programação contínua do Video Wall
            </p>
          </div>
        </div>

        {/* Global Playback Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() =>
              onUpdatePlaylist({
                ...playlist,
                loop: !playlist.loop,
              })
            }
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-2 ${
              playlist.loop
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}
          >
            <Repeat className="w-4 h-4" />
            <span>Repetição em Loop {playlist.loop ? 'Ativa' : 'Desativada'}</span>
          </button>

          {/* Previous Media */}
          {onPrevMedia && (
            <button
              onClick={onPrevMedia}
              className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs transition"
              title="Mídia Anterior"
            >
              <SkipBack className="w-4 h-4" />
            </button>
          )}

          {/* Play/Pause */}
          <button
            onClick={onTogglePlayback}
            className={`px-5 py-2 font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg ${
              isPlaying
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Programação Rodando (Ao Vivo)' : 'Programação Pausada'}</span>
          </button>

          {/* Next Media */}
          {onNextMedia && (
            <button
              onClick={onNextMedia}
              className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs transition flex items-center gap-1.5 px-3"
              title="Próxima Mídia"
            >
              <span>Avançar</span>
              <SkipForward className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Playlist Items Queue */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Sequência de Exibição</h3>
          <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {isPlaying ? 'Auto-avanço da playlist ativo no servidor' : 'Auto-avanço pausado'}
          </span>
        </div>

        <div className="space-y-3">
          {playlist.items.map((item, index) => {
            const media = mediaItems.find((m) => m.id === item.mediaId);
            const isActive = media?.id === activeMediaId;

            if (!media) return null;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition flex flex-col md:flex-row items-center justify-between gap-4 ${
                  isActive
                    ? 'bg-emerald-950/30 border-emerald-500/80 ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-950/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Left: Index, Thumbnail & Title */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <span className="w-6 font-mono text-xs font-bold text-slate-500">#{index + 1}</span>

                  <div className="w-16 h-10 rounded-lg bg-slate-900 overflow-hidden relative border border-slate-800 shrink-0">
                    <img src={media.thumbnailUrl || media.url} alt="" className="w-full h-full object-cover" />
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                      <span>{media.name}</span>
                      {isActive && (
                        <span className="px-2.5 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-bold rounded-full animate-pulse">
                          No Ar Agora
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-500 uppercase">{media.type}</p>
                  </div>
                </div>

                {/* Center: Duration & Transition Controls */}
                <div className="flex items-center gap-4 text-xs w-full md:w-auto justify-between md:justify-end">
                  {/* Duration input */}
                  <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="number"
                      min="3"
                      max="300"
                      value={item.durationSeconds}
                      onChange={(e) => updateItem(item.id, { durationSeconds: Number(e.target.value) })}
                      className="w-12 bg-transparent text-slate-200 font-mono text-xs text-center focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 font-semibold">seg</span>
                  </div>

                  {/* Transition Selector */}
                  <select
                    value={item.transition}
                    onChange={(e) => updateItem(item.id, { transition: e.target.value as any })}
                    className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                  >
                    <option value="fade">Transição Suave (Fade)</option>
                    <option value="slide">Deslizar Lateral</option>
                    <option value="zoom">Zoom Suave</option>
                    <option value="none">Corte Direto</option>
                  </select>

                  {/* Reorder & Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded border border-slate-800 disabled:opacity-30"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === playlist.items.length - 1}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded border border-slate-800 disabled:opacity-30"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onSelectActiveMedia(media.id)}
                      className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded border border-emerald-500/40 transition"
                      title="Forçar Exibição Agora"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 bg-slate-900 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded border border-slate-800 hover:border-red-500/30 transition"
                      title="Remover da Playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
