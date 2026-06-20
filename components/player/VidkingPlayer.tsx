'use client';

import { useEffect, useMemo } from 'react';

export type VidkingMediaType = 'movie' | 'tv';

export interface VidkingPlayerOptions {
  tmdbId: string;
  mediaType: VidkingMediaType;
  season?: number;
  episode?: number;
  color?: string;
  autoPlay?: boolean;
  nextEpisode?: boolean;
  episodeSelector?: boolean;
  progress?: number;
}

export interface VidkingPlayerEventData {
  event: 'timeupdate' | 'play' | 'pause' | 'ended' | 'seeked';
  currentTime: number;
  duration: number;
  progress: number;
  id: string;
  mediaType: VidkingMediaType;
  season?: number;
  episode?: number;
  timestamp: number;
}

interface VidkingPlayerProps {
  options: VidkingPlayerOptions;
  onPlayerEvent?: (eventData: VidkingPlayerEventData) => void;
  className?: string;
}

function buildVidkingSrc(options: VidkingPlayerOptions) {
  const baseUrl = 'https://www.vidking.net/embed';
  const { tmdbId, mediaType, season, episode, color, autoPlay, nextEpisode, episodeSelector, progress } = options;
  const path = mediaType === 'movie'
    ? `/movie/${encodeURIComponent(tmdbId)}`
    : `/tv/${encodeURIComponent(tmdbId)}/${season || 1}/${episode || 1}`;

  const params = new URLSearchParams();
  if (color) params.set('color', color.replace(/^#/, ''));
  if (autoPlay) params.set('autoPlay', 'true');
  if (nextEpisode) params.set('nextEpisode', 'true');
  if (episodeSelector) params.set('episodeSelector', 'true');
  if (typeof progress === 'number' && !Number.isNaN(progress)) params.set('progress', String(Math.max(0, Math.floor(progress))));

  return `${baseUrl}${path}${params.toString() ? `?${params.toString()}` : ''}`;
}

export function VidkingPlayer({ options, onPlayerEvent, className }: VidkingPlayerProps) {
  const src = useMemo(() => buildVidkingSrc(options), [options]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (typeof data !== 'string') return;

      let payload: { type?: string; data?: VidkingPlayerEventData } | null = null;
      try {
        payload = JSON.parse(data);
      } catch {
        return;
      }

      if (!payload || payload.type !== 'PLAYER_EVENT' || !payload.data) return;
      onPlayerEvent?.(payload.data);
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onPlayerEvent]);

  return (
    <div className={className}>
      <iframe
        src={src}
        title={`Vidking ${options.mediaType} player ${options.tmdbId}`}
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="w-full h-full border-0"
      />
    </div>
  );
}
