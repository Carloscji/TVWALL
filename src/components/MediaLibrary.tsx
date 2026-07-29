import React from 'react';
import { MediaItem } from '../types';
import { formatBytes, formatDuration } from '../lib/videoWallUtils';
import {
  Upload,
  Film,
  Image as ImageIcon,
  Trash2,
  Play,
  Plus,
  Tv,
  Check,
  FileVideo,
  FileImage,
  Sparkles,
  Clock,
  HardDrive,
} from 'lucide-react';

interface MediaLibraryProps {
  mediaItems: MediaItem[];
  activeMediaId?: string;
  onSelectActiveMedia: (mediaId: string) => void;
  onUploadMedia: (file: File, title: string, duration: number) => Promise<void>;
  onDeleteMedia: (id: string) => void;
  onAddToPlaylist: (mediaId: string) => void;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  mediaItems,
  activeMediaId,
  onSelectActiveMedia,
  onUploadMedia,
  onDeleteMedia,
  onAddToPlaylist,
}) => {
  const [filter, setFilter] = React.useState<'all' | 'image' | 'video'>('all');
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadTitle, setUploadTitle] = React.useState('');
  const [uploadDuration, setUploadDuration] = React.useState(10);
  const [addedSuccessId, setAddedSuccessId] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const filteredMedia = mediaItems.filter((m) => {
    if (filter === 'image') return m.type === 'image';
    if (filter === 'video') return m.type === 'video';
    return true;
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await onUploadMedia(file, uploadTitle || file.name, uploadDuration);
      setUploadTitle('');
    } catch (err) {
      console.error('Erro ao enviar arquivo:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await onUploadMedia(file, file.name, uploadDuration);
    } catch (err) {
      console.error('Erro ao enviar arquivo:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerAddToPlaylist = (id: string) => {
    onAddToPlaylist(id);
    setAddedSuccessId(id);
    setTimeout(() => setAddedSuccessId(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Upload Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Card */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Enviar Nova Mídia</h2>
                <p className="text-xs text-slate-400">Imagens (PNG, JPG, WEBP) ou Vídeos (MP4, WEBM) até 200MB</p>
              </div>
            </div>

            {/* Title & Duration Options */}
            <div className="space-y-3 mb-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Título da Mídia (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Cardápio de Almoço - Painel 3 TVs"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Tempo de Exibição Padrão (Segundos para Imagens)
                </label>
                <input
                  type="number"
                  min="3"
                  max="300"
                  value={uploadDuration}
                  onChange={(e) => setUploadDuration(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-950/60 hover:bg-slate-950 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Clique para escolher ou arraste arquivos aqui</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Suporta resoluções Full HD e 4K Panorâmico</p>
              </div>
            </div>
          </div>

          {isUploading && (
            <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-medium flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Enviando e processando arquivo para o Video Wall...
            </div>
          )}
        </div>

        {/* Media Stats & Filters */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-white">Biblioteca de Conteúdos</h2>
                <p className="text-xs text-slate-400">Total de {mediaItems.length} mídias cadastradas no sistema</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    filter === 'all' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  Todas ({mediaItems.length})
                </button>
                <button
                  onClick={() => setFilter('image')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    filter === 'image' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  Imagens
                </button>
                <button
                  onClick={() => setFilter('video')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    filter === 'video' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  Vídeos
                </button>
              </div>
            </div>

            {/* Media Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-1">
              {filteredMedia.map((media) => {
                const isActive = media.id === activeMediaId;
                const isVideo = media.type === 'video';

                return (
                  <div
                    key={media.id}
                    className={`bg-slate-950 border rounded-2xl p-3 flex flex-col justify-between transition relative group shadow-md ${
                      isActive ? 'border-emerald-500 ring-1 ring-emerald-500/50' : 'border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Media Thumbnail & Badge */}
                    <div className="w-full h-32 rounded-xl bg-slate-900 overflow-hidden relative mb-3 group">
                      {isVideo ? (
                        <video
                          src={media.url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <img src={media.url} alt="" className="w-full h-full object-cover" />
                      )}

                      {/* Type Badge */}
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-950/80 backdrop-blur rounded-md text-[10px] font-semibold text-slate-200 border border-slate-800 flex items-center gap-1">
                        {isVideo ? <FileVideo className="w-3 h-3 text-cyan-400" /> : <FileImage className="w-3 h-3 text-emerald-400" />}
                        <span>{isVideo ? 'Vídeo' : 'Imagem'}</span>
                      </div>

                      {/* Active TV Badge */}
                      {isActive && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-500 text-slate-950 font-bold text-[10px] rounded-md shadow flex items-center gap-1">
                          <Tv className="w-3 h-3" /> Ao Vivo na TV
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="space-y-1 mb-3">
                      <h4 className="text-xs font-bold text-slate-100 truncate">{media.name}</h4>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" /> {media.duration}s
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3 text-slate-500" /> {formatBytes(media.size)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-900 text-xs">
                      <button
                        onClick={() => onSelectActiveMedia(media.id)}
                        className={`flex-1 py-1.5 rounded-lg font-semibold text-[11px] transition flex items-center justify-center gap-1 ${
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800'
                        }`}
                      >
                        <Play className="w-3 h-3" /> Exibir Agora
                      </button>

                      <button
                        onClick={() => triggerAddToPlaylist(media.id)}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition"
                        title="Adicionar à Playlist"
                      >
                        {addedSuccessId === media.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Plus className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => onDeleteMedia(media.id)}
                        className="p-1.5 bg-slate-900 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg border border-slate-800 hover:border-red-500/30 transition"
                        title="Excluir Mídia"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
