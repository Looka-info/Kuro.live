'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertTriangle,
  ChevronLeft,
  CheckCircle,
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
  stripHtml,
  type ViewerProgress,
} from '@/lib/utils';
import type { AniListMedia } from '@/lib/anilist';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { VidkingPlayer, type VidkingPlayerEventData } from '@/components/player/VidkingPlayer';
import { useWatchlistStore } from '@/store';

interface StreamResponse {
  sources?: Array<{ url: string; quality: string; isM3U8: boolean }>;
  embedUrl?: string;
  episodeId?: string;
  server?: string;
}

type CommentEntry = {
  id: number;
  author: string;
  text: string;
  createdAt: string;
};

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
  const [comments, setComments] = useState<CommentEntry[]>([]);
  const [commentText, setCommentText] = useState('');
  const [activeServerIndex, setActiveServerIndex] = useState(0);

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

  const searchParams = useSearchParams();
  const useVidking = searchParams.get('player') === 'vidking';

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
  const description = stripHtml(anime?.description);
  const selectedStreamSource = streamSources[activeServerIndex] || streamSources[0];

  useEffect(() => {
    if (activeServerIndex >= streamSources.length) {
      setActiveServerIndex(0);
    }
  }, [activeServerIndex, streamSources.length]);

  const bannerImage = anime?.bannerImage || anime?.coverImage?.large || anime?.coverImage?.medium || '';
  const ratingLabel = typeof anime?.averageScore === 'number' ? `★ ${(anime.averageScore / 10).toFixed(1)}` : null;
  const metadataBadges = [
    anime?.seasonYear ? String(anime.seasonYear) : null,
    anime?.format || null,
    anime?.episodes ? `${anime.episodes} eps` : null,
  ].filter(Boolean) as string[];

  const vidkingConfig = useMemo(() => {
    if (!anime?.externalLinks?.length) return null;

    const tmdbLink = anime.externalLinks.find(link =>
      Boolean(link?.url?.includes('themoviedb.org')) || Boolean(link?.site?.toLowerCase().includes('tmdb'))
    )?.url;
    if (!tmdbLink) return null;

    try {
      const url = new URL(tmdbLink);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const [type, resourceId] = pathParts;
      const validId = resourceId && /^\\d+$/.test(resourceId) ? resourceId : null;
      if (!validId) return null;

      if (type === 'movie') {
        return {
          tmdbId: validId,
          mediaType: 'movie' as const,
          autoPlay: true,
          color: 'e50914',
          progress: 0,
        };
      }

      if (type === 'tv') {
        return {
          tmdbId: validId,
          mediaType: 'tv' as const,
          season: Number.isFinite(epNum) ? epNum : 1,
          episode: epNum,
          autoPlay: true,
          nextEpisode: true,
          episodeSelector: true,
          color: anime.coverImage?.color?.replace('#', '') || '9146ff',
          progress: 0,
        };
      }

      return null;
    } catch {
      return null;
    }
  }, [anime, epNum]);

  const handleVidkingEvent = (eventData: VidkingPlayerEventData) => {
    if (eventData.event === 'ended') {
      handleMarkWatched();
    }
  };

  useEffect(() => {
    setViewerProgress(getViewerProgress());
    setEpisodeCounted(hasWatchedEpisode(xpAnimeId, epNum));
  }, [xpAnimeId, epNum]);

  useEffect(() => {
    if (!anime || episodeCounted || !xpAnimeId) return;

    const timer = window.setTimeout(() => {
      handleMarkWatched();
    }, 15_000);

    return () => window.clearTimeout(timer);
  }, [anime, episodeCounted, epNum, xpAnimeId]);

  useEffect(() => {
    if (!id) return;

    const storageKey = `kuro-comments-${id}-${epNum}`;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        setComments(JSON.parse(saved));
      } else {
        setComments([]);
      }
    } catch {
      setComments([]);
    }
  }, [id, epNum]);

  const handleMarkWatched = () => {
    const result = awardWatchedXp(xpAnimeId, epNum);
    setViewerProgress(result.progress);
    setEpisodeCounted(true);
    updateWatchlistProgress(xpAnimeId, epNum);
  };

  const handlePostComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed || !id) return;

    const entry: CommentEntry = {
      id: Date.now(),
      author: 'You',
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    const nextComments = [entry, ...comments];
    setComments(nextComments);
    setCommentText('');

    const storageKey = `kuro-comments-${id}-${epNum}`;
    window.localStorage.setItem(storageKey, JSON.stringify(nextComments));
  };

  return (
    <div className="min-h-screen pt-20 px-3 pb-10 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_280px]">
      <aside className="hidden xl:block xl:sticky xl:top-20 xl:self-start">
        <div className="bg-kuro-surface border border-kuro-border rounded-xl overflow-hidden h-full">
          <div className="p-4 border-b border-kuro-border">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg text-kuro-text tracking-wide">Episodes</h2>
                <p className="text-xs text-kuro-dim mt-1">
                  {availableEpisodeNumbers.length
                    ? `${availableEpisodeNumbers.length} available`
                    : `${totalEps || 'Unknown'} total`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 rounded-full border border-kuro-border bg-kuro-surface2 px-3 py-2 text-xs font-semibold text-kuro-text hover:border-kuro-primary hover:text-white hover:bg-kuro-surface3 transition"
              >
                <ChevronLeft size={14} /> Back
              </button>
            </div>
          </div>
          <div className="h-[calc(100vh-260px)] overflow-y-auto custom-scrollbar p-2">
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
                      : 'bg-kuro-surface3 text-kuro-muted hover:bg-kuro-surface2 hover:text-white',
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded flex items-center justify-center text-xs',
                    isCurrent ? 'bg-kuro-primary text-white shadow-red-glow' : 'bg-kuro-surface3 group-hover:bg-kuro-border text-kuro-text',
                  )}>
                    {episode}
                  </div>
                  <span className="text-sm line-clamp-1">Episode {episode}</span>
                </Link>
              );
            })}

            {!anime && !isLoadingAnime && (
              <p className="text-sm text-kuro-dim text-center py-8">Episode list unavailable</p>
            )}
          </div>
        </div>
      </aside>

      <main className="flex flex-col gap-5">
        <div className="bg-kuro-surface rounded-xl border border-kuro-border shadow-card overflow-hidden">
          <div className="relative aspect-video w-full overflow-hidden bg-black">
            {isLoadingAnime || isLoadingStream ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="w-10 h-10 border-4 border-kuro-primary border-t-transparent rounded-full animate-spin shadow-red-glow" />
              </div>
            ) : useVidking && vidkingConfig ? (
              <VidkingPlayer
                options={vidkingConfig}
                onPlayerEvent={handleVidkingEvent}
                className="absolute inset-0 h-full w-full"
              />
            ) : embedUrl ? (
              <iframe
                src={embedUrl}
                title={`${title} Episode ${epNum}`}
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute inset-0 h-full w-full"
              />
            ) : streamSources.length ? (
              <VideoPlayer
                sources={selectedStreamSource ? [selectedStreamSource] : streamSources}
                poster={anime?.coverImage.large || anime?.coverImage.medium}
                fill
                className="h-full"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-center p-8">
                <div>
                  <p className="text-sm text-kuro-muted">No playable stream available for this episode.</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-3xl border border-kuro-border bg-kuro-surface2 p-4 shadow-card">
            <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-2xl bg-kuro-surface3 p-4 border border-kuro-border">
                <p className="text-sm text-kuro-text">You're watching <span className="font-semibold text-kuro-primary">Episode {epNum}</span>.</p>
                <p className="mt-2 text-xs text-kuro-dim">If the current server doesn't work, try another server beside.</p>
              </div>

              <div className="rounded-2xl bg-kuro-surface3 p-4 border border-kuro-border">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="rounded-full border border-kuro-border bg-kuro-surface px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-kuro-dim">SUB</span>
                  <span className="rounded-full border border-kuro-border bg-kuro-surface px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-kuro-dim">H-SUB</span>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  {streamSources.length ? streamSources.map((source, index) => (
                    <button
                      key={`${source.quality}-${index}`}
                      type="button"
                      onClick={() => setActiveServerIndex(index)}
                      className={cn(
                        'rounded-xl border px-3 py-2 text-sm font-medium transition',
                        index === activeServerIndex
                          ? 'border-kuro-primary bg-kuro-primary/15 text-white'
                          : 'border-kuro-border bg-kuro-surface text-kuro-text hover:border-kuro-primary hover:bg-kuro-surface2 hover:text-white',
                      )}
                    >
                      {source.quality || `Server ${index + 1}`}
                    </button>
                  )) : (
                    <div className="rounded-xl border border-kuro-border bg-kuro-surface px-3 py-2 text-sm text-kuro-dim">No servers found</div>
                  )}

                  {embedUrl && (
                    <button
                      type="button"
                      className="rounded-xl border border-kuro-border bg-kuro-surface text-kuro-text px-3 py-2 text-sm font-medium hover:border-kuro-primary hover:bg-kuro-surface2 hover:text-white"
                    >
                      Embed
                    </button>
                  )}

                  {streamSources.some(source => !source.isM3U8) && (
                    <button
                      type="button"
                      className="rounded-xl border border-kuro-border bg-kuro-surface text-kuro-text px-3 py-2 text-sm font-medium hover:border-kuro-primary hover:bg-kuro-surface2 hover:text-white"
                    >
                      Download
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl text-kuro-text tracking-wide">{title}</h1>
                <p className="text-xs text-kuro-muted mt-1">Episode {epNum}</p>
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-kuro-dim">
                {episodeCounted ? 'Auto-counted' : 'Auto-counts after 15s'}
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-kuro-surface2 p-4 border border-kuro-border">
                <p className="text-xs uppercase tracking-[0.2em] text-kuro-dim mb-2">Progress</p>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-kuro-primary transition-all" style={{ width: `${viewerProgress?.progressPercent || 0}%` }} />
                </div>
                <p className="mt-2 text-xs text-kuro-dim">Level {viewerProgress?.level || 1} · {viewerProgress?.watchedCount || 0} episodes counted</p>
              </div>
              <div className="rounded-xl bg-kuro-surface2 p-4 border border-kuro-border">
                <p className="text-xs uppercase tracking-[0.2em] text-kuro-dim mb-2">Episode info</p>
                <p className="text-sm text-kuro-text">{anime?.format || 'Anime'} · {anime?.seasonYear || 'Unknown year'}</p>
                <p className="text-sm text-kuro-text mt-1">{anime?.episodes ? `${anime.episodes} episodes` : 'Episode count unknown'}</p>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-kuro-border bg-gradient-to-br from-kuro-surface2 via-kuro-surface2 to-kuro-surface/80 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]">
              <div className="relative">
                {bannerImage ? (
                  <div className="relative h-36 w-full sm:h-44">
                    <Image
                      src={bannerImage}
                      alt={`${title} banner`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <div className="flex flex-col gap-1">
                        <p className="text-[11px] uppercase tracking-[0.3em] text-kuro-dim">Synopsis</p>
                        <h2 className="font-display text-xl sm:text-2xl text-white tracking-wide">
                          {title || 'Anime'}
                        </h2>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-1 rounded-full bg-kuro-primary" />
                      <h2 className="font-display text-lg text-kuro-text tracking-wide">Synopsis</h2>
                    </div>
                  </div>
                )}

                <div className="px-5 pb-5">
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {ratingLabel && (
                      <span className="rounded-full border border-kuro-primary/40 bg-kuro-primary/15 px-3 py-1 text-xs font-semibold text-kuro-primary backdrop-blur">
                        {ratingLabel}
                      </span>
                    )}
                    {metadataBadges.map(badge => (
                      <span key={badge} className="rounded-full border border-kuro-border bg-kuro-surface/90 px-3 py-1 text-xs text-kuro-dim">
                        {badge}
                      </span>
                    ))}
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-kuro-muted whitespace-pre-line line-clamp-6 sm:line-clamp-none">
                    {description || 'No synopsis available.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-kuro-border bg-kuro-surface2 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg text-kuro-text tracking-wide">Comments</h2>
                  <p className="mt-1 text-xs text-kuro-dim">Share your thoughts on this episode.</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <textarea
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  rows={3}
                  placeholder="Write a comment..."
                  className="w-full rounded-xl border border-kuro-border bg-kuro-surface px-4 py-3 text-sm text-kuro-text outline-none ring-0 placeholder:text-kuro-dim"
                />
                <button
                  type="button"
                  onClick={handlePostComment}
                  className="rounded-full border border-kuro-border bg-kuro-surface px-4 py-2 text-sm font-semibold text-kuro-text transition hover:border-kuro-primary hover:text-white"
                >
                  Post comment
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {comments.length ? comments.map(comment => (
                  <div key={comment.id} className="rounded-xl border border-kuro-border bg-kuro-surface p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-kuro-text">{comment.author}</p>
                      <p className="text-[11px] text-kuro-dim">{new Date(comment.createdAt).toLocaleString()}</p>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-kuro-muted">{comment.text}</p>
                  </div>
                )) : (
                  <p className="text-sm text-kuro-dim">No comments yet. Start the conversation.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <aside className="w-full lg:w-80 lg:flex-shrink-0 flex flex-col">
        <div className="bg-kuro-surface border border-kuro-border rounded-xl flex-1 flex flex-col h-[360px] lg:h-[600px]">
          <div className="p-4 border-b border-kuro-border">
            <h2 className="font-display text-lg text-kuro-text tracking-wide">Related anime</h2>
            <p className="text-xs text-kuro-dim mt-1">More titles from this universe.</p>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-3">
            {anime?.relations?.edges?.length ? anime.relations.edges.slice(0, 6).map(edge => (
              <Link
                key={edge.node.id}
                href={`/anime/${edge.node.id}`}
                className="flex items-center gap-3 rounded-xl border border-kuro-border p-3 transition-all hover:border-kuro-primary hover:bg-kuro-surface2"
              >
                <div className="relative h-14 w-10 overflow-hidden rounded-lg bg-kuro-surface3">
                  <Image
                    src={edge.node.coverImage.medium || ''}
                    alt={getTitle(edge.node.title)}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-kuro-text line-clamp-2">{getTitle(edge.node.title)}</p>
                  <p className="text-[10px] uppercase text-kuro-dim mt-1">{edge.relationType.replace(/_/g, ' ')}</p>
                </div>
              </Link>
            )) : (
              <p className="text-sm text-kuro-dim">No related titles available.</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
