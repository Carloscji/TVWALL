import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface SmartVideoPlayerProps {
  src: string;
  fitClass: string;
  onEnded: () => void;
  onError?: () => void;
}

export const SmartVideoPlayer: React.FC<SmartVideoPlayerProps> = ({
  src,
  fitClass,
  onEnded,
  onError,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    const isHls = src.endsWith('.m3u8') || src.includes('.m3u8') || src.includes('m3u8');

    if (isHls && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((err) => console.warn('HLS play warning:', err));
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          console.warn('HLS fatal error encountered, attempting recovery:', data);
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls?.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls?.recoverMediaError();
          } else {
            hls?.destroy();
            onError?.();
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') && isHls) {
      video.src = src;
      video.play().catch((e) => console.warn('Native HLS play warning:', e));
    } else {
      video.src = src;
      video.play().catch((e) => console.warn('Standard video play warning:', e));
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src, onError]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      preload="auto"
      onEnded={onEnded}
      onError={() => {
        console.warn('Erro na reprodução de vídeo no hardware.');
        onError?.();
      }}
      className={`max-w-none ${fitClass}`}
    />
  );
};
