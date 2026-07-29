import React from 'react';
import {
  VideoWallConfig,
  MediaItem,
  TransformConfig,
  BezelConfig,
  ScreenConfig,
} from '../types';
import { getGlobalTransformStyle } from '../lib/videoWallUtils';
import {
  RotateCw,
  Maximize2,
  Minimize2,
  Sliders,
  Grid,
  Eye,
  Settings2,
  Layers,
  Move,
  Lock,
  Unlock,
  Tv,
  Check,
  Zap,
  Sparkles,
  Info,
  Sun,
  ShieldAlert,
} from 'lucide-react';

interface VideoWallStudioProps {
  wallConfig: VideoWallConfig;
  onUpdateWallConfig: (newConfig: VideoWallConfig) => void;
  activeMedia?: MediaItem;
  mediaItems: MediaItem[];
  onSelectActiveMedia: (mediaId: string) => void;
  showAlignmentGrid: boolean;
  onToggleGrid: () => void;
}

export const VideoWallStudio: React.FC<VideoWallStudioProps> = ({
  wallConfig,
  onUpdateWallConfig,
  activeMedia,
  mediaItems,
  onSelectActiveMedia,
  showAlignmentGrid,
  onToggleGrid,
}) => {
  const [activeTab, setActiveTab] = React.useState<'transform' | 'bezel' | 'screens'>('transform');
  const [selectedScreenIndex, setSelectedScreenIndex] = React.useState<number>(0);

  const transform = wallConfig.globalTransform;
  const bezel = wallConfig.bezel;

  // Helper to update global transform
  const updateTransform = (updates: Partial<TransformConfig>) => {
    const newTransform = { ...transform, ...updates };
    onUpdateWallConfig({
      ...wallConfig,
      globalTransform: newTransform,
      updatedAt: new Date().toISOString(),
    });
  };

  // Helper to update bezel settings
  const updateBezel = (updates: Partial<BezelConfig>) => {
    const newBezel = { ...bezel, ...updates };
    onUpdateWallConfig({
      ...wallConfig,
      bezel: newBezel,
      updatedAt: new Date().toISOString(),
    });
  };

  // Helper to update individual screen configuration
  const updateScreen = (screenIndex: number, updates: Partial<ScreenConfig>) => {
    const newScreens = wallConfig.screens.map((s) => (s.id === screenIndex ? { ...s, ...updates } : s));
    onUpdateWallConfig({
      ...wallConfig,
      screens: newScreens,
      updatedAt: new Date().toISOString(),
    });
  };

  // Quick preset handlers
  const applyPresetFit = (mode: 'cover' | 'contain' | 'stretch' | 'rotate90') => {
    if (mode === 'rotate90') {
      updateTransform({
        rotation: 90,
        fitMode: 'cover',
        scaleX: 1.0,
        scaleY: 1.0,
        positionX: 0,
        positionY: 0,
      });
    } else if (mode === 'cover') {
      updateTransform({
        rotation: 0,
        fitMode: 'cover',
        scaleX: 1.0,
        scaleY: 1.0,
        positionX: 0,
        positionY: 0,
      });
    } else if (mode === 'stretch') {
      updateTransform({
        rotation: 0,
        fitMode: 'stretch',
        scaleX: 1.5,
        scaleY: 1.0,
        positionX: 0,
        positionY: 0,
      });
    } else if (mode === 'contain') {
      updateTransform({
        rotation: 0,
        fitMode: 'contain',
        scaleX: 1.0,
        scaleY: 1.0,
        positionX: 0,
        positionY: 0,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Media Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Mídia em Exibição no Studio</h2>
            <p className="text-xs text-slate-400">Selecione uma imagem ou vídeo para testar as transformações em tempo real</p>
          </div>
        </div>

        {/* Media Dropdown / Thumbnails */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {mediaItems.map((media) => {
            const isSelected = media.id === activeMedia?.id;
            return (
              <button
                key={media.id}
                onClick={() => onSelectActiveMedia(media.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition shrink-0 ${
                  isSelected
                    ? 'bg-emerald-500/20 border-emerald-500/80 text-emerald-300 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="w-5 h-5 rounded overflow-hidden bg-slate-800 shrink-0">
                  {media.thumbnailUrl || media.url ? (
                    <img src={media.thumbnailUrl || media.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-700" />
                  )}
                </div>
                <span className="max-w-[120px] truncate">{media.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Studio Grid: Left Side Interactive Canvas Preview, Right Side Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Interactive Video Wall Canvas (8 Columns) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col justify-between shadow-2xl relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Simulador do Painel 3x TV Vertical (3x1 Portrait Wall)
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onToggleGrid}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
                  showAlignmentGrid
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                {showAlignmentGrid ? 'Grade de Teste Ativa' : 'Grade de Teste'}
              </button>
            </div>
          </div>

          {/* Video Wall Interactive Stage */}
          <div className="w-full aspect-[16/9] bg-slate-950 border-2 border-slate-800 rounded-xl relative overflow-hidden flex items-center justify-center p-4 sm:p-8 shadow-inner">
            {/* The 3-TV Vertical Wall Framework */}
            <div
              className="relative w-full h-full max-w-4xl max-h-[500px] flex items-center justify-center border-2 border-dashed border-slate-800/80 rounded-lg p-2"
              style={{
                perspective: '1000px',
              }}
            >
              {/* 3 Vertical TV Frames Container */}
              <div
                className="w-full h-full grid grid-cols-3 gap-2 relative bg-slate-950/90 rounded border border-slate-800/60 p-1 overflow-hidden"
                style={{
                  gap: `${bezel?.enabled ? bezel.gapPx || 16 : 2}px`,
                }}
              >
                {/* Loop 3 Screens */}
                {[0, 1, 2].map((screenIdx) => {
                  const screenConfig = wallConfig.screens.find((s) => s.id === screenIdx);
                  const brightness = screenConfig?.brightness ?? 100;
                  const contrast = screenConfig?.contrast ?? 100;

                  return (
                    <div
                      key={screenIdx}
                      className="relative h-full bg-slate-900 border-2 border-slate-700/80 rounded flex flex-col justify-between overflow-hidden group shadow-md"
                      style={{
                        filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                      }}
                    >
                      {/* Physical TV Label / Header Overlay */}
                      <div className="absolute top-2 left-2 z-20 px-2 py-0.5 bg-slate-950/80 backdrop-blur border border-slate-700/60 rounded text-[10px] font-mono font-bold text-slate-300 shadow">
                        TV {screenIdx + 1}
                      </div>

                      {/* Screen Content Container with exact 1/3 viewport slicing & global transform */}
                      <div className="w-full h-full relative overflow-hidden bg-slate-950">
                        {/* Media Element inside slice */}
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{
                            width: '300%', // 300% width so 1/3 is displayed per TV
                            left: `-${screenIdx * 100}%`,
                            height: '100%',
                          }}
                        >
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={getGlobalTransformStyle(transform)}
                          >
                            {activeMedia ? (
                              activeMedia.type === 'video' ? (
                                <video
                                  src={activeMedia.url}
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                  className={`max-w-none ${
                                    transform.fitMode === 'cover'
                                      ? 'w-full h-full object-cover'
                                      : transform.fitMode === 'stretch'
                                      ? 'w-full h-full object-fill'
                                      : 'max-w-full max-h-full object-contain'
                                  }`}
                                />
                              ) : (
                                <img
                                  src={activeMedia.url}
                                  alt=""
                                  className={`max-w-none ${
                                    transform.fitMode === 'cover'
                                      ? 'w-full h-full object-cover'
                                      : transform.fitMode === 'stretch'
                                      ? 'w-full h-full object-fill'
                                      : 'max-w-full max-h-full object-contain'
                                  }`}
                                />
                              )
                            ) : (
                              <div className="text-center text-slate-600 text-xs">Sem mídia selecionada</div>
                            )}
                          </div>
                        </div>

                        {/* Alignment Grid Overlay if enabled */}
                        {showAlignmentGrid && (
                          <div className="absolute inset-0 z-30 pointer-events-none border border-cyan-500/40 grid grid-cols-4 grid-rows-6">
                            <div className="col-span-4 row-span-6 border border-cyan-500/20 flex items-center justify-center">
                              <span className="text-[10px] font-mono text-cyan-400 bg-slate-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                                TV {screenIdx + 1} ALIGN
                              </span>
                            </div>
                            <div className="absolute inset-0 border-t border-b border-cyan-400/30 top-1/2 -translate-y-1/2" />
                            <div className="absolute inset-0 border-l border-r border-cyan-400/30 left-1/2 -translate-x-1/2" />
                          </div>
                        )}
                      </div>

                      {/* Physical TV Bottom Bezel Marker */}
                      <div className="h-2 bg-slate-950 border-t border-slate-800 flex items-center justify-center">
                        <div className="w-3 h-0.5 bg-slate-700 rounded-full" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Fit Mode Buttons */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-slate-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-400" /> Presets Rápidos de Enquadramento:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => applyPresetFit('cover')}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg font-medium transition"
              >
                Preencher Parede (Cover)
              </button>
              <button
                onClick={() => applyPresetFit('rotate90')}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg font-medium transition flex items-center gap-1 text-emerald-400 font-semibold"
              >
                <RotateCw className="w-3.5 h-3.5" /> Girar 90° Vertical
              </button>
              <button
                onClick={() => applyPresetFit('stretch')}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg font-medium transition"
              >
                Esticar 3 Telas
              </button>
              <button
                onClick={() => applyPresetFit('contain')}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg font-medium transition"
              >
                Conter sem Cortes
              </button>
            </div>
          </div>
        </div>

        {/* Right Side Control Controls Panel (4 Columns) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col justify-between space-y-6">
          <div>
            {/* Control Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6">
              <button
                onClick={() => setActiveTab('transform')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'transform'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Transformação
              </button>
              <button
                onClick={() => setActiveTab('bezel')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'bezel'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Moldura (Bezel)
              </button>
              <button
                onClick={() => setActiveTab('screens')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'screens'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Ajuste TVs
              </button>
            </div>

            {/* Tab 1: Transform Controls (Rotation, Scale, Position, Flip) */}
            {activeTab === 'transform' && (
              <div className="space-y-5 text-xs">
                {/* Rotation Control */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-200 flex items-center gap-2">
                      <RotateCw className="w-4 h-4 text-emerald-400" /> Rotação do Conteúdo
                    </label>
                    <span className="font-mono text-emerald-400 font-bold text-sm">
                      {transform.rotation}°
                    </span>
                  </div>

                  {/* Quick Angle Buttons */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[0, 90, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        onClick={() => updateTransform({ rotation: deg })}
                        className={`py-1.5 rounded-lg font-mono text-xs border transition ${
                          transform.rotation === deg
                            ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>

                  {/* Slider */}
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={transform.rotation}
                    onChange={(e) => updateTransform({ rotation: Number(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Scaling Controls (Scale X and Scale Y) */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-200 flex items-center gap-2">
                      <Maximize2 className="w-4 h-4 text-cyan-400" /> Escala e Estique (Scale X / Y)
                    </label>
                    <button
                      onClick={() => updateTransform({ lockAspect: !transform.lockAspect })}
                      className={`p-1.5 rounded border transition ${
                        transform.lockAspect
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                      title={transform.lockAspect ? 'Proporção Bloqueada' : 'Estique Independente Ativo'}
                    >
                      {transform.lockAspect ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Scale X */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Escala Horizontal (X)</span>
                      <span className="font-mono text-cyan-400 font-bold">{transform.scaleX.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="3.0"
                      step="0.05"
                      value={transform.scaleX}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (transform.lockAspect) {
                          updateTransform({ scaleX: val, scaleY: val });
                        } else {
                          updateTransform({ scaleX: val });
                        }
                      }}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>

                  {/* Scale Y */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Escala Vertical (Y)</span>
                      <span className="font-mono text-cyan-400 font-bold">{transform.scaleY.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="3.0"
                      step="0.05"
                      value={transform.scaleY}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (transform.lockAspect) {
                          updateTransform({ scaleX: val, scaleY: val });
                        } else {
                          updateTransform({ scaleY: val });
                        }
                      }}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Position Offset Controls (Pan X, Y) */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                  <label className="font-semibold text-slate-200 flex items-center gap-2">
                    <Move className="w-4 h-4 text-indigo-400" /> Posicionamento (Pan X, Y)
                  </label>

                  {/* Position X */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Deslocamento X</span>
                      <span className="font-mono text-indigo-400 font-bold">{transform.positionX}%</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      step="1"
                      value={transform.positionX}
                      onChange={(e) => updateTransform({ positionX: Number(e.target.value) })}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Position Y */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Deslocamento Y</span>
                      <span className="font-mono text-indigo-400 font-bold">{transform.positionY}%</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      step="1"
                      value={transform.positionY}
                      onChange={(e) => updateTransform({ positionY: Number(e.target.value) })}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Bezel Compensation Controls */}
            {activeTab === 'bezel' && (
              <div className="space-y-5 text-xs">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-100">Compensação de Borda (Bezel)</h4>
                      <p className="text-[11px] text-slate-400">Compensa o espaço físico das molduras das 3 TVs</p>
                    </div>
                    <button
                      onClick={() => updateBezel({ enabled: !bezel.enabled })}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                        bezel.enabled
                          ? 'bg-emerald-500 text-slate-950 shadow'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {bezel.enabled ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>

                  <div className="p-3 bg-emerald-950/20 border border-emerald-800/30 rounded-lg text-emerald-300 text-[11px] leading-relaxed">
                    A compensação de borda faz com que linhas, diagonais e objetos pareçam passar por trás da moldura das TVs sem saltos visuais.
                  </div>

                  {/* Bezel Gap Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-slate-300">
                      <span>Distância da Moldura (Gap em Pixels)</span>
                      <span className="font-mono text-emerald-400 font-bold">{bezel.gapPx}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      step="2"
                      value={bezel.gapPx}
                      onChange={(e) => updateBezel({ gapPx: Number(e.target.value) })}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>

                  {/* Physical Bezel Width in mm */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-slate-300">
                      <span>Largura Física da Moldura (mm)</span>
                      <span className="font-mono text-emerald-400 font-bold">{bezel.leftBezelMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      step="1"
                      value={bezel.leftBezelMm}
                      onChange={(e) =>
                        updateBezel({
                          leftBezelMm: Number(e.target.value),
                          rightBezelMm: Number(e.target.value),
                        })
                      }
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Fine Screen Calibration */}
            {activeTab === 'screens' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {[0, 1, 2].map((idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedScreenIndex(idx)}
                      className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                        selectedScreenIndex === idx
                          ? 'bg-emerald-500 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      TV {idx + 1}
                    </button>
                  ))}
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                  <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-400" /> Calibração da TV {selectedScreenIndex + 1}
                  </h4>

                  {/* Brightness */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Brilho</span>
                      <span className="font-mono text-amber-400 font-bold">
                        {wallConfig.screens[selectedScreenIndex]?.brightness ?? 100}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      step="5"
                      value={wallConfig.screens[selectedScreenIndex]?.brightness ?? 100}
                      onChange={(e) =>
                        updateScreen(selectedScreenIndex, { brightness: Number(e.target.value) })
                      }
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Contrast */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Contraste</span>
                      <span className="font-mono text-amber-400 font-bold">
                        {wallConfig.screens[selectedScreenIndex]?.contrast ?? 100}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      step="5"
                      value={wallConfig.screens[selectedScreenIndex]?.contrast ?? 100}
                      onChange={(e) =>
                        updateScreen(selectedScreenIndex, { contrast: Number(e.target.value) })
                      }
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reset Button */}
          <button
            onClick={() =>
              onUpdateWallConfig({
                ...wallConfig,
                globalTransform: {
                  rotation: 0,
                  scaleX: 1.0,
                  scaleY: 1.0,
                  lockAspect: true,
                  fitMode: 'cover',
                  positionX: 0,
                  positionY: 0,
                  flipH: false,
                  flipV: false,
                  zoom: 1.0,
                },
              })
            }
            className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition"
          >
            Redefinir Padrões de Transformação
          </button>
        </div>
      </div>
    </div>
  );
};
