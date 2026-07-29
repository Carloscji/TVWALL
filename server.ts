import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_WALL_CONFIG,
  INITIAL_MEDIA_ITEMS,
  INITIAL_PLAYLIST,
  INITIAL_PLAYERS,
} from './src/data/sampleData.js';
import { AppState, VideoWallConfig, Playlist, MediaItem, PlayerDevice } from './src/types.js';

const app = express();
const PORT = 3000;

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded files with strict Byte Range Streaming & HLS support
app.get('/uploads/:filename', (req: Request, res: Response, next) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return next();
  }
  const ext = path.extname(filePath).toLowerCase();
  if (['.mp4', '.webm', '.m3u8', '.ts', '.mov', '.m4v'].includes(ext)) {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        res.status(416).send(`Requested range not satisfiable\n${start} >= ${fileSize}`);
        return;
      }

      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type':
          ext === '.m3u8'
            ? 'application/x-mpegURL'
            : ext === '.ts'
            ? 'video/mp2t'
            : ext === '.webm'
            ? 'video/webm'
            : 'video/mp4',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      };

      res.writeHead(206, head);
      file.pipe(res);
      return;
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type':
          ext === '.m3u8'
            ? 'application/x-mpegURL'
            : ext === '.ts'
            ? 'video/mp2t'
            : ext === '.webm'
            ? 'video/webm'
            : 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }
  next();
});

app.use('/uploads', express.static(uploadDir));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer storage for media uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'signage-' + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB limit for videos
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem e vídeo são permitidos.'));
    }
  },
});

// In-Memory Database State with persistent backup to JSON file
const DATA_FILE = path.join(process.cwd(), 'signage-data.json');

let appState: AppState = {
  wallConfig: INITIAL_WALL_CONFIG,
  playlist: INITIAL_PLAYLIST,
  mediaItems: INITIAL_MEDIA_ITEMS,
  players: INITIAL_PLAYERS,
  activeMediaId: INITIAL_MEDIA_ITEMS[0].id,
  currentPlayIndex: 0,
  isPlaying: true,
  showAlignmentGrid: false,
};

// Load saved data if exists
if (fs.existsSync(DATA_FILE)) {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const saved = JSON.parse(raw);
    if (saved.wallConfig) appState.wallConfig = saved.wallConfig;
    if (saved.playlist) appState.playlist = saved.playlist;
    if (saved.mediaItems) appState.mediaItems = saved.mediaItems;
    if (saved.players) appState.players = saved.players;
    if (saved.activeMediaId) appState.activeMediaId = saved.activeMediaId;
  } catch (err) {
    console.error('Erro ao carregar signage-data.json:', err);
  }
}

function saveData() {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(
        {
          wallConfig: appState.wallConfig,
          playlist: appState.playlist,
          mediaItems: appState.mediaItems,
          players: appState.players,
          activeMediaId: appState.activeMediaId,
        },
        null,
        2
      )
    );
  } catch (err) {
    console.error('Erro ao salvar signage-data.json:', err);
  }
}

// SSE (Server-Sent Events) clients registry for real-time live sync
let sseClients: Response[] = [];

function broadcastUpdate(eventType: string, data?: any) {
  const payload = JSON.stringify({
    type: eventType,
    state: appState,
    extra: data,
    timestamp: new Date().toISOString(),
  });

  sseClients.forEach((client) => {
    client.write(`data: ${payload}\n\n`);
  });
}

// ---------------- PLAYLIST AUTO-ADVANCE SCHEDULER ----------------
let playlistTimer: NodeJS.Timeout | null = null;

function scheduleNextPlaylistItem() {
  if (playlistTimer) {
    clearTimeout(playlistTimer);
    playlistTimer = null;
  }

  if (!appState.isPlaying) return;

  const items = appState.playlist.items.filter((item) => item.enabled !== false);
  if (items.length === 0) return;

  if (appState.currentPlayIndex >= items.length) {
    appState.currentPlayIndex = 0;
  }

  const currentItem = items[appState.currentPlayIndex];
  if (!currentItem) return;

  if (appState.activeMediaId !== currentItem.mediaId) {
    appState.activeMediaId = currentItem.mediaId;
    broadcastUpdate('ACTIVE_MEDIA_CHANGED', {
      activeMediaId: appState.activeMediaId,
      currentPlayIndex: appState.currentPlayIndex,
    });
  }

  const durationMs = Math.max(3, currentItem.durationSeconds || 10) * 1000;

  playlistTimer = setTimeout(() => {
    advancePlaylist(1);
  }, durationMs);
}

function advancePlaylist(step = 1) {
  const items = appState.playlist.items.filter((item) => item.enabled !== false);
  if (items.length === 0) return;

  let nextIndex = appState.currentPlayIndex + step;

  if (nextIndex >= items.length) {
    if (appState.playlist.loop !== false) {
      nextIndex = 0;
    } else {
      appState.isPlaying = false;
      saveData();
      broadcastUpdate('PLAYLIST_FINISHED', { isPlaying: false });
      return;
    }
  } else if (nextIndex < 0) {
    nextIndex = items.length - 1;
  }

  appState.currentPlayIndex = nextIndex;
  const nextItem = items[nextIndex];
  if (nextItem) {
    appState.activeMediaId = nextItem.mediaId;
  }

  saveData();
  broadcastUpdate('PLAYLIST_ADVANCED', {
    activeMediaId: appState.activeMediaId,
    currentPlayIndex: appState.currentPlayIndex,
    isPlaying: appState.isPlaying,
  });

  scheduleNextPlaylistItem();
}

// ---------------- API ENDPOINTS ----------------

// GET full app state
app.get('/api/state', (_req: Request, res: Response) => {
  res.json({ success: true, data: appState });
});

// SSE Live Stream Endpoint for TV players and Admin UI
app.get('/api/sse', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  sseClients.push(res);

  // Send initial state upon connection
  res.write(
    `data: ${JSON.stringify({
      type: 'INIT',
      state: appState,
      timestamp: new Date().toISOString(),
    })}\n\n`
  );

  req.on('close', () => {
    sseClients = sseClients.filter((client) => client !== res);
  });
});

// Media API
app.get('/api/media', (_req: Request, res: Response) => {
  res.json({ success: true, data: appState.mediaItems });
});

app.post('/api/media/upload', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'Nenhum arquivo enviado.' });
    return;
  }

  const isVideo = req.file.mimetype.startsWith('video/');
  const newMedia: MediaItem = {
    id: 'media_' + Date.now(),
    name: req.body.title || req.file.originalname,
    type: isVideo ? 'video' : 'image',
    url: `/uploads/${req.file.filename}`,
    thumbnailUrl: isVideo ? undefined : `/uploads/${req.file.filename}`,
    duration: isVideo ? 15 : Number(req.body.duration) || 10,
    size: req.file.size,
    dimensions: {
      width: isVideo ? 1920 : 3240,
      height: isVideo ? 1080 : 1920,
    },
    createdAt: new Date().toISOString(),
  };

  appState.mediaItems.unshift(newMedia);

  // Auto-add to playlist if requested
  if (req.body.addToPlaylist === 'true') {
    appState.playlist.items.push({
      id: 'item_' + Date.now(),
      mediaId: newMedia.id,
      durationSeconds: newMedia.duration,
      transition: 'fade',
      enabled: true,
    });
  }

  saveData();
  broadcastUpdate('MEDIA_ADDED', newMedia);

  res.json({ success: true, data: newMedia });
});

app.delete('/api/media/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const media = appState.mediaItems.find((m) => m.id === id);

  if (media && media.url.startsWith('/uploads/')) {
    const filename = path.basename(media.url);
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error('Erro ao deletar arquivo:', e);
      }
    }
  }

  appState.mediaItems = appState.mediaItems.filter((m) => m.id !== id);
  appState.playlist.items = appState.playlist.items.filter((item) => item.mediaId !== id);

  if (appState.activeMediaId === id) {
    appState.activeMediaId = appState.mediaItems[0]?.id;
  }

  saveData();
  broadcastUpdate('MEDIA_DELETED', { id });
  res.json({ success: true });
});

// Video Wall Config API
app.get('/api/wall-config', (_req: Request, res: Response) => {
  res.json({ success: true, data: appState.wallConfig });
});

app.put('/api/wall-config', (req: Request, res: Response) => {
  const newConfig = req.body as VideoWallConfig;
  if (!newConfig) {
    res.status(400).json({ success: false, message: 'Dados de configuração inválidos.' });
    return;
  }

  appState.wallConfig = {
    ...appState.wallConfig,
    ...newConfig,
    updatedAt: new Date().toISOString(),
  };

  saveData();
  broadcastUpdate('WALL_CONFIG_UPDATED', appState.wallConfig);
  res.json({ success: true, data: appState.wallConfig });
});

// Playlist API
app.get('/api/playlist', (_req: Request, res: Response) => {
  res.json({ success: true, data: appState.playlist });
});

app.put('/api/playlist', (req: Request, res: Response) => {
  const newPlaylist = req.body as Playlist;
  appState.playlist = {
    ...newPlaylist,
    updatedAt: new Date().toISOString(),
  };

  saveData();
  broadcastUpdate('PLAYLIST_UPDATED', appState.playlist);
  scheduleNextPlaylistItem();
  res.json({ success: true, data: appState.playlist });
});

// Playback Control Endpoints
app.post('/api/playback/toggle', (req: Request, res: Response) => {
  const { playing } = req.body;
  if (typeof playing === 'boolean') {
    appState.isPlaying = playing;
  } else {
    appState.isPlaying = !appState.isPlaying;
  }

  saveData();
  broadcastUpdate('PLAYBACK_STATUS_CHANGED', { isPlaying: appState.isPlaying });
  scheduleNextPlaylistItem();
  res.json({ success: true, isPlaying: appState.isPlaying });
});

app.post('/api/playback/next', (_req: Request, res: Response) => {
  advancePlaylist(1);
  res.json({ success: true, currentPlayIndex: appState.currentPlayIndex, activeMediaId: appState.activeMediaId });
});

app.post('/api/playback/prev', (_req: Request, res: Response) => {
  advancePlaylist(-1);
  res.json({ success: true, currentPlayIndex: appState.currentPlayIndex, activeMediaId: appState.activeMediaId });
});

// Active Media Trigger Endpoint
app.post('/api/playback/active', (req: Request, res: Response) => {
  const { mediaId, index } = req.body;
  if (mediaId) {
    appState.activeMediaId = mediaId;
    const foundIdx = appState.playlist.items.findIndex((item) => item.mediaId === mediaId);
    if (foundIdx !== -1) {
      appState.currentPlayIndex = foundIdx;
    }
  }
  if (typeof index === 'number') {
    appState.currentPlayIndex = index;
  }

  saveData();
  broadcastUpdate('ACTIVE_MEDIA_CHANGED', {
    activeMediaId: appState.activeMediaId,
    currentPlayIndex: appState.currentPlayIndex,
  });
  scheduleNextPlaylistItem();
  res.json({ success: true, activeMediaId: appState.activeMediaId });
});

// Toggle Alignment Grid
app.post('/api/playback/grid', (req: Request, res: Response) => {
  const { enabled } = req.body;
  appState.showAlignmentGrid = typeof enabled === 'boolean' ? enabled : !appState.showAlignmentGrid;
  broadcastUpdate('GRID_TOGGLED', { showAlignmentGrid: appState.showAlignmentGrid });
  res.json({ success: true, showAlignmentGrid: appState.showAlignmentGrid });
});

// Players Management API
app.get('/api/players', (_req: Request, res: Response) => {
  res.json({ success: true, data: appState.players });
});

app.post('/api/players/ping', (req: Request, res: Response) => {
  const { playerId, screenIndex, pairingCode } = req.body;
  let player = appState.players.find((p) => p.id === playerId || p.pairingCode === pairingCode);

  if (!player) {
    player = {
      id: playerId || 'player_' + Date.now(),
      name: `Display ${pairingCode || 'Novo'}`,
      pairingCode: pairingCode || 'PAIR-' + Math.floor(1000 + Math.random() * 9000),
      screenIndex: typeof screenIndex !== 'undefined' ? screenIndex : 'all',
      status: 'online',
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'],
      lastPing: new Date().toISOString(),
    };
    appState.players.push(player);
  } else {
    player.status = 'online';
    player.lastPing = new Date().toISOString();
    if (typeof screenIndex !== 'undefined') player.screenIndex = screenIndex;
  }

  saveData();
  broadcastUpdate('PLAYER_PING', player);
  res.json({ success: true, player, wallConfig: appState.wallConfig, playlist: appState.playlist });
});

app.put('/api/players/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = appState.players.findIndex((p) => p.id === id);
  if (index !== -1) {
    appState.players[index] = {
      ...appState.players[index],
      ...req.body,
    };
    saveData();
    broadcastUpdate('PLAYER_UPDATED', appState.players[index]);
    res.json({ success: true, data: appState.players[index] });
  } else {
    res.status(404).json({ success: false, message: 'Player não encontrado.' });
  }
});

// Start Server & Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WallSync Digital Signage rodando na porta ${PORT}`);
    scheduleNextPlaylistItem();
  });
}

startServer();
