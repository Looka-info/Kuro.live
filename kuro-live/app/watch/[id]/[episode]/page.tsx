'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  ChevronLeft,
  CheckCircle,
  List,
  RefreshCw,
  ShieldCheck,
  Trophy,
  Tv,
} from 'lucide-react';
import {
  awardWatchedXp,
  cn,
  getTitle,
  getViewerProgress,
  hasWatchedEpisode,
  type ViewerProgress,
} from '@/lib/utils';
import type { AniListMedia } from '@/lib/anilist';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { useWatchlistStore } from '@/store';

interface StreamResponse {
  sources?: Array<{ url: string; quality: string; isM3U8: boolean }>;
  embedUrl?: string;
  episodeId?: string;
  server?: string;
}

function getEpisodeNumber(title: string | undefined, index: number) {
  const match = title?.match(/(?:episode|ep)\s*\.?\s*(\d+)/i);
  return match ? Number(match[1]) : index + 1;
}

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const epNum = parseInt(params.episode as string, 10) || 1;
  const updateWatchlistProgress = useWatchlistStore(state => state.updateProgress);
  const [viewerProgress, setViewerProgress] = useState<ViewerProgress | null>(null);
  const [episodeCounted, setEpisodeCounted] = useState(false);

  const { data: anime, isLoading: isLoadingAnime } = useQuery<AniListMedia>({
    queryKey: ['anime', id],
    queryFn: async () => {
      const response = await fetch(`/api/anime/${id}`);
      if (!response.ok) throw new Error('This title is temporarily unavailable.');
      return response.json();
    },
    staleTime: 60 * 60 * 1000,
  });

  const {
    data: streamData,
    isLoading: isLoadingStream,
    isFetching: isFetchingStream,
    error,
    refetch: retryStream,
  } = useQuery<StreamResponse>({
    queryKey: ['episode-stream', anime?.id, epNum],
    queryFn: async () => {
      if (!anime) throw new Error('Anime details are unavailable.');

      const search = new URLSearchParams();
      const preferredTitle = anime.title.english || anime.title.romaji || getTitle(anime.title);
      search.set('title', preferredTitle);
      if (anime.title.romaji && anime.title.romaji !== preferredTitle) search.set('romaji', anime.title.romaji);
      if (anime.title.native) search.set('native', anime.title.native);
      if (anime.seasonYear) search.set('year', String(anime.seasonYear));
      search.set('animeId', String(anime.id));
      if (anime.idMal || anime.malId) search.set('malId', String(anime.idMal || anime.malId));
      if (anime.anikotoId) search.set('anikotoId', String(anime.anikotoId));
      search.set('episode', String(epNum));

      const response = await fetch(`/api/stream?${search.toString()}`);
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.message || body.error || 'This episode is temporarily unavailable.');
      }
      return body;
    },
    enabled: Boolean(anime),
    staleTime: 6 * 60 * 60 * 1000,
    retry: false,
  });

  const title = anime ? getTitle(anime.title) : '';
  const totalEps = anime?.episodes || 0;
  const streamSources = streamData?.sources || [];
  const embedUrl = streamData?.embedUrl;
  const streamingEpisodes = (anime?.streamingEpisodes || []).map((episode, index) => ({
    ...episode,
    number: episode.number || getEpisodeNumber(episode.title, index),
  }));
  const availableEpisodeNumbers = Array.from(new Set(streamingEpisodes.map(episode => episode.number)))
    .sort((a, b) => a - b);
  const episodeNumbers = availableEpisodeNumbers.length
    ? availableEpisodeNumbers
    : totalEps > 0
      ? Array.from({ length: totalEps }, (_, index) => index + 1)
      : [epNum];
  const xpAnimeId = anime?.id || id;

  useEffect(() => {
    setViewerProgress(getViewerProgress());
    setEpisodeCounted(hasWatchedEpisode(xpAnimeId, epNum));
  }, [xpAnimeId, epNum]);

  const handleMarkWatched = () => {
    const result = awardWatchedXp(xpAnimeId, epNum);
    setViewerProgress(result.progress);
    setEpisodeCounted(true);
    updateWatchlistProgress(xpAnimeId, epNum);
  };

  return (
    <div className="min-h-screen pt-20 px-3 pb-10 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto flex flex-col lg:flex-row gap-5 lg:gap-6">
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <Link href={`/anime/${id}`} className="flex items-center gap-2 text-kuro-muted hover:text-white transition-colors group">
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-kuro-text line-clamp-1">{title || 'Loading...'}</span>
              <span className="text-xs text-kuro-primary">Episode {epNum}</span>
            </div>
          </Link>
        </div>

        <section suppressHydrationWarning className="w-full min-h-[300px] sm:min-h-[420px] bg-kuro-surface rounded-xl border border-kuro-border shadow-card overflow-hidden relative">
          <div className="absolute inset-0 bg-red-glow opacity-60 pointer-events-none" />
          <div className="relative z-10 h-full min-h-[300px] p-3 sm:min-h-[420px] sm:p-10 flex flex-col justify-center">
            {isLoadingAnime || isLoadingStream ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-kuro-primary border-t-transparent rounded-full animate-spin shadow-red-glow" />
                <p className="text-sm text-kuro-muted font-medium">Preparing your episode...</p>
              </div>
            ) : embedUrl ? (
              <div className="w-full">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h1 className="font-display text-xl sm:text-3xl text-white tracking-wide">
                      {title} Episode {epNum}
                    </h1>
                  </div>
                  <ShieldCheck className="text-emerald-400 flex-shrink-0" size={28} />
                </div>
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-kuro-border bg-black shadow-lg">
                  <iframe
                    src={embedUrl}
                    title={`${title} Episode ${epNum}`}
                    allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
              </div>
            ) : streamSources.length ? (
              <div className="w-full">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h1 className="font-display text-xl sm:text-3xl text-white tracking-wide">
                      {title} Episode {epNum}
                    </h1>
                    <p className="text-xs text-kuro-muted mt-1">Now playing</p>
                  </div>
                  <ShieldCheck className="text-emerald-400 flex-shrink-0" size={28} />
                </div>
                <VideoPlayer
                  sources={streamSources}
                  poster={anime?.coverImage.large || anime?.coverImage.medium}
                />
              </div>
            ) : error ? (
              <div className="max-w-xl mx-auto text-center">
                <AlertTriangle size={36} className="text-amber-400 mx-auto mb-4" />
                <h1 className="font-display text-3xl text-white tracking-wide mb-2">Stream unavailable</h1>
                <p className="text-sm text-kuro-muted leading-relaxed">{error.message}</p>
                <button
                  onClick={() => retryStream()}
                  disabled={isFetchingStream}
                  className="neo-button mx-auto mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-black disabled:opacity-60"
                >
                  <RefreshCw size={15} className={isFetchingStream ? 'animate-spin' : ''} />
                  {isFetchingStream ? 'Retrying' : 'Try again'}
                </button>
              </div>
            ) : (
              <div className="max-w-xl mx-auto text-center">
                <Tv size={36} className="text-kuro-primary mx-auto mb-4" />
                <h1 className="font-display text-3xl text-white tracking-wide mb-2">No stream found</h1>
                <p className="text-sm text-kuro-muted">
                  This episode is not available right now. Try another episode or return later.
                </p>
              </div>
            )}
          </div>
        </section>

        <div className="mt-4 flex flex-col gap-3 p-3 bg-kuro-surface border border-kuro-border rounded-xl xs:flex-row xs:items-center xs:justify-between sm:p-4">
          <div className="grid grid-cols-2 gap-2 xs:flex">
            <button
              onClick={() => router.push(`/watch/${id}/${epNum - 1}`)}
              disabled={epNum <= 1}
              className="px-4 py-2 rounded-lg bg-kuro-surface2 text-sm font-medium text-kuro-text hover:bg-kuro-primary hover:text-white disabled:opacity-30 disabled:hover:bg-kuro-surface2 disabled:hover:text-kuro-text transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => router.push(`/watch/${id}/${epNum + 1}`)}
              disabled={totalEps > 0 ? epNum >= totalEps : false}
              className="px-4 py-2 rounded-lg bg-kuro-surface2 text-sm font-medium text-kuro-text hover:bg-kuro-primary hover:text-white disabled:opacity-30 disabled:hover:bg-kuro-surface2 disabled:hover:text-kuro-text transition-all"
            >
              Next
            </button>
          </div>
          <Link
            href={`/anime/${id}`}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-kuro-muted hover:text-white hover:bg-kuro-surface2 transition-all text-sm font-medium"
          >
            <List size={16} /> Details
          </Link>
        </div>

        <div className="mt-4 grid gap-3 rounded-xl border border-kuro-border bg-kuro-surface p-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-kuro-primary" />
              <p className="text-sm font-bold text-white">Viewer Level {viewerProgress?.level || 1}</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-white shadow-red-glow transition-all"
                style={{ width: `${viewerProgress?.progressPercent || 0}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-kuro-muted">
              {viewerProgress?.currentLevelXp || 0}/{viewerProgress?.nextLevelXp || 120} XP to next level
              {' '}· {viewerProgress?.watchedCount || 0} episodes counted
            </p>
          </div>
          <button
            type="button"
            onClick={handleMarkWatched}
            disabled={episodeCounted}
            className={cn(
              'neo-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-xs font-black uppercase tracking-[0.14em] transition-all disabled:cursor-not-allowed',
              episodeCounted
                ? 'border border-white/10 bg-white/[0.04] text-kuro-muted'
                : 'bg-white text-black shadow-red-glow hover:bg-white/90',
            )}
          >
            <CheckCircle size={15} />
            {episodeCounted ? 'Episode counted' : 'Mark watched +35 XP'}
          </button>
        </div>
      </div>

      <aside className="w-full lg:w-80 lg:flex-shrink-0 flex flex-col">
        <div className="bg-kuro-surface border border-kuro-border rounded-xl flex-1 flex flex-col h-[360px] lg:h-[600px]">
          <div className="p-4 border-b border-kuro-border">
            <h2 className="font-display text-lg text-kuro-text tracking-wide">Episodes</h2>
            <p className="text-xs text-kuro-dim">
              {availableEpisodeNumbers.length
                ? `${availableEpisodeNumbers.length} Available Episodes`
                : `${totalEps || 'Unknown'} Episodes Total`}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {anime && episodeNumbers.map(episode => {
              const isCurrent = episode === epNum;
              return (
                <Link
                  key={episode}
                  href={`/watch/${id}/${episode}`}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg transition-all mb-1 group',
                    isCurrent
                      ? 'bg-kuro-primary/20 border border-kuro-primary/50 text-kuro-primary font-medium'
                      : 'hover:bg-kuro-surface2 text-kuro-muted hover:text-white',
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded flex items-center justify-center text-xs',
                    isCurrent ? 'bg-kuro-primary text-white shadow-red-glow' : 'bg-kuro-surface3 group-hover:bg-kuro-border text-kuro-text',
                  )}>
                    {episode}
                  </div>
                  <span className="text-sm line-clamp-1">Episode {episode}</span>
                  {isCurrent && <div className="ml-auto w-2 h-2 rounded-full bg-kuro-primary animate-pulse" />}
                </Link>
              );
            })}

            {!anime && !isLoadingAnime && (
              <p className="text-sm text-kuro-dim text-center py-8">Episode list unavailable</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
