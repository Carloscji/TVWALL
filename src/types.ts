export type MediaType = 'image' | 'video';

export interface MediaItem {
  id: string;
  name: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  duration: number; // default display duration in seconds
  size: number; // in bytes
  dimensions?: {
    width: number;
    height: number;
  };
  createdAt: string;
}

export interface TransformConfig {
  rotation: number; // degrees -180 to 180 (or 0, 90, 180, 270)
  scaleX: number; // 0.1 to 5.0
  scaleY: number; // 0.1 to 5.0
  lockAspect: boolean;
  fitMode: 'cover' | 'contain' | 'stretch' | 'custom';
  positionX: number; // percentage offset -100 to 100
  positionY: number; // percentage offset -100 to 100
  flipH: boolean;
  flipV: boolean;
  zoom: number; // 0.5 to 3.0
}

export interface BezelConfig {
  enabled: boolean;
  topBezelMm: number; // top bezel in mm
  bottomBezelMm: number;
  leftBezelMm: number;
  rightBezelMm: number;
  activeWidthMm: number; // screen active width in mm (e.g., 680mm for portrait 55")
  activeHeightMm: number; // screen active height in mm (e.g., 1210mm for portrait 55")
  gapPx: number; // bezel gap compensation in virtual px
}

export type WallLayoutType = '3x1_portrait' | '1x3_portrait' | '3x1_landscape' | 'custom';

export interface ScreenConfig {
  id: number; // 0, 1, 2
  name: string; // e.g. "TV 1 - Esquerda", "TV 2 - Centro", "TV 3 - Direita"
  orientation: 'portrait' | 'landscape';
  offsetX: number; // fine tuning offset
  offsetY: number;
  scaleOverride: number;
  rotationOverride: number;
  brightness: number; // 50 to 150 %
  contrast: number; // 50 to 150 %
}

export interface VideoWallConfig {
  id: string;
  name: string;
  layout: WallLayoutType;
  screenCount: number; // 3
  screenOrientation: 'portrait' | 'landscape'; // 'portrait' for vertical TVs
  resolutionPerScreen: {
    width: number; // 1080
    height: number; // 1920
  };
  bezel: BezelConfig;
  globalTransform: TransformConfig;
  screens: ScreenConfig[];
  updatedAt: string;
}

export interface PlaylistItem {
  id: string;
  mediaId: string;
  durationSeconds: number;
  transition: 'fade' | 'slide' | 'zoom' | 'none';
  customTransform?: Partial<TransformConfig>;
  enabled: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  items: PlaylistItem[];
  loop: boolean;
  autoPlay: boolean;
  updatedAt: string;
}

export interface PlayerDevice {
  id: string;
  name: string;
  pairingCode: string;
  screenIndex: 'all' | 0 | 1 | 2; // 'all' = Single canvas for all 3 screens, 0 = TV 1, 1 = TV 2, 2 = TV 3
  status: 'online' | 'offline';
  ipAddress?: string;
  userAgent?: string;
  lastPing: string;
  currentMediaId?: string;
}

export interface AppState {
  wallConfig: VideoWallConfig;
  playlist: Playlist;
  mediaItems: MediaItem[];
  players: PlayerDevice[];
  activeMediaId?: string;
  currentPlayIndex: number;
  isPlaying: boolean;
  showAlignmentGrid: boolean;
}
