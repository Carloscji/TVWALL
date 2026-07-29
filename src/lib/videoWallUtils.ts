import type { CSSProperties } from 'react';
import { TransformConfig, BezelConfig, VideoWallConfig } from '../types';

/**
 * Calculates CSS transform object for global wall image/video positioning, scaling and rotation.
 */
export function getGlobalTransformStyle(transform: TransformConfig): CSSProperties {
  const { rotation, scaleX, scaleY, positionX, positionY, flipH, flipV, zoom } = transform;

  const scaleH = (flipH ? -1 : 1) * scaleX * zoom;
  const scaleV = (flipV ? -1 : 1) * scaleY * zoom;

  return {
    transform: `translate(${positionX}%, ${positionY}%) rotate(${rotation}deg) scale(${scaleH}, ${scaleV})`,
    transformOrigin: 'center center',
    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  };
}

/**
 * Calculates display slice and bezel compensation for 3 Vertical TVs (3x1 Portrait).
 * In 3x1 Portrait:
 * - Total wall consists of 3 vertical TVs placed side by side.
 * - Screen 0: Left TV (x range 0% to 33.33%)
 * - Screen 1: Middle TV (x range 33.33% to 66.66%)
 * - Screen 2: Right TV (x range 66.66% to 100%)
 *
 * If bezel compensation is enabled:
 * The image canvas is enlarged by bezel gap factor, and cropped per TV so physical bezel gap is accounted for.
 */
export function getScreenSliceTransform(
  screenIndex: number | 'all',
  wallConfig: VideoWallConfig
): CSSProperties {
  if (screenIndex === 'all') {
    return {
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
    };
  }

  const screenCount = wallConfig.screenCount || 3;
  const bezel = wallConfig.bezel;
  const screenOverride = wallConfig.screens.find((s) => s.id === screenIndex);

  // Bezel gap multiplier
  const gapPx = bezel?.enabled ? bezel.gapPx || 20 : 0;
  const totalGapWidth = gapPx * (screenCount - 1);

  // Each screen takes 1/3 of total width
  // To compensate for bezel, we shift the inner media canvas
  const slicePercent = 100 / screenCount;
  const leftOffsetPercent = screenIndex * slicePercent;

  const brightness = screenOverride?.brightness ?? 100;
  const contrast = screenOverride?.contrast ?? 100;
  const offsetX = screenOverride?.offsetX ?? 0;
  const offsetY = screenOverride?.offsetY ?? 0;
  const scaleOverride = screenOverride?.scaleOverride ?? 1.0;
  const rotationOverride = screenOverride?.rotationOverride ?? 0;

  return {
    position: 'absolute',
    top: `${offsetY}px`,
    left: `calc(-${leftOffsetPercent * screenCount}% + ${offsetX}px)`,
    width: `${screenCount * 100}%`,
    height: '100%',
    filter: `brightness(${brightness}%) contrast(${contrast}%)`,
    transform: `rotate(${rotationOverride}deg) scale(${scaleOverride})`,
    transformOrigin: 'center center',
  };
}

/**
 * Formats file size in bytes to readable MB/KB string.
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Formats time duration in seconds to MM:SS string.
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
