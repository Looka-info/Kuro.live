'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Plus, Check, Star, Clock, Users, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, getBestImage, getTitle, stripHtml, formatScore, formatEpisodes, formatDuration, formatSeason, statusColor, formatStatus, formatNum, scoreColor } from '@/lib/utils';
import { useWatchlistStore } from '@/store';
import type { AniListMedia } from '@/lib/anilist';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import { AnimeCommunityPanel } from '@/components/community/AnimeCommunityPanel';

type Tab = 'episodes' | 'characters' | 'staff' | 'related';

function getEpisodeNumber(title: string | undefined, index: number) {
  const match = title?.match(/(?:episode|ep)\s*\.?\s*(\d+)/i);
  return match ? Number(match[1]) : index + 1;
}

async function fetchAnimeDetail(id: string): Promise<AniListMedia> {
  const res = await fetch(`/api/anime/${id}`);
  if (!res.ok) throw new Error('Failed to fetch anime');
  return res.json();
}

export default function AnimeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('episodes');
  const [episodePage, setEpisodePage] = useState(1);
  const { add, remove, isInList } = useWatchlistStore();
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const EPISODES_PER_PAGE = 25;

  const { data: anime, isLoading } = useQuery({
    queryKey: ['anime', id],
    queryFn: () => fetchAnimeDetail(id),
    staleTime: 30 * 60 * 1000,
  });

  const inList = anime ? isInList(anime.id) : false;

  useEffect(() => {
    if (!anime) return;
    gsap.fromTo(headerRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
    gsap.fromTo(contentRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.2 });
  }, [anime]);

  if (isLoading) return <DetailPageSkeleton />;
  if (!anime) return (
    <div className="min-h-screen pt-20 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">😶</div>
        <h2 className="text-xl text-kuro-text mb-2">Anime not found</h2>
        <Link href="/" className="text-kuro-primary hover:underline">Go home</Link>
      </div>
    </div>
  );

  const title = getTitle(anime.title);
  const image = getBestImage(anime.coverImage);
  const banner = anime.bannerImage || image;
  const description = stripHtml(anime.description);
  const playbackId = anime.anikotoId || anime.id;

  const handleWatchlist = () => {
    if (inList) {
      remove(anime.id);
      toast('Removed from watchlist');
    } else {
      add({ id: anime.id, title, image, status: 'plan_to_watch', progress: 0, totalEpisodes: anime.episodes ?? undefined });
      toast.success('Added to watchlist!');
    }
  };

  // Episode pagination
  const totalEps = anime.episodes || 0;
  const totalEpPages = Math.ceil(totalEps / EPISODES_PER_PAGE);
  const epNums = Array.from(
    { length: Math.min(EPISODES_PER_PAGE, totalEps - (episodePage - 1) * EPISODES_PER_PAGE) },
    (_, i) => (episodePage - 1) * EPISODES_PER_PAGE + i + 1
  );
  const streamingEpisodeNumbers = Array.from(new Set(
    (anime.streamingEpisodes || []).map((episode, index) => episode.number || getEpisodeNumber(episode.title, index))
  )).sort((a, b) => a - b);
  const visibleEpisodeNumbers = streamingEpisodeNumbers.length ? streamingEpisodeNumbers : epNums;

  // Score ring
  const score = anime.averageScore || 0;
  const scoreAngle = (score / 100) * 360;
  const sColor = scoreColor(score);

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <div className="relative h-60 w-full sm:h-80 md:h-96">
        <Image src={banner} alt={title} fill className="object-cover object-top" priority unoptimized />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-kuro-bg/70 to-kuro-bg" />
        <div className="absolute inset-0 bg-gradient-to-r from-kuro-bg/60 to-transparent" />
        <button
          onClick={() => router.back()}
          className="absolute top-20 left-4 sm:left-6 lg:left-8 p-2 rounded-xl glass border border-kuro-border text-kuro-muted hover:text-white transition-all"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Main content */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-24 relative z-10" ref={headerRef}>
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          {/* Poster */}
          <div className="flex w-full flex-shrink-0 flex-col items-center gap-4 sm:w-auto sm:flex-row md:block md:w-52">
            <div className="w-36 shrink-0 sm:w-44 md:w-full">
            <div className="relative rounded-xl overflow-hidden shadow-card-hover border border-kuro-border aspect-[2/3]">
              <Image src={image} alt={title} fill className="object-cover" unoptimized />
            </div>
            </div>

            {/* Score ring */}
            {score > 0 && (
              <div className="mt-0 flex flex-col items-center gap-1 md:mt-3">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg"
                  style={{
                    background: `conic-gradient(${sColor} ${scoreAngle}deg, #2a2a2a ${scoreAngle}deg)`,
                    boxShadow: `0 0 16px ${sColor}40`,
                  }}
                >
                  <div className="w-12 h-12 rounded-full bg-kuro-surface flex items-center justify-center" style={{ color: sColor }}>
                    {formatScore(score)}
                  </div>
                </div>
                <span className="text-xs text-kuro-dim">Community Score</span>
              </div>
            )}

            {/* Watchlist */}
            <button
              onClick={handleWatchlist}
              className={cn(
                'w-full max-w-52 mt-0 md:mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
                inList
                  ? 'bg-kuro-primary/20 text-kuro-primary border border-kuro-primary/40 hover:bg-kuro-primary/30'
                  : 'bg-kuro-primary hover:bg-kuro-primary-hover text-white red-glow'
              )}
            >
              {inList ? <><Check size={16} /> In Watchlist</> : <><Plus size={16} /> Add to List</>}
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Status */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', statusColor(anime.status))}>
                {formatStatus(anime.status)}
              </span>
              {anime.format && <span className="text-xs px-2.5 py-1 rounded-full bg-kuro-surface2 text-kuro-muted">{anime.format}</span>}
              {anime.season && <span className="text-xs text-kuro-dim">{formatSeason(anime.season, anime.seasonYear)}</span>}
            </div>

            {/* Title */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-kuro-text leading-none tracking-wide mb-2">
              {title}
            </h1>
            {anime.title?.native && (
              <p className="text-kuro-dim text-sm mb-3">{anime.title.native}</p>
            )}

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              {score > 0 && (
                <div className="flex items-center gap-1.5 text-yellow-400">
                  <Star size={15} className="fill-yellow-400" />
                  <span className="font-semibold">{formatScore(score)}</span>
                </div>
              )}
              {anime.episodes && (
                <div className="flex items-center gap-1.5 text-kuro-muted text-sm">
                  <Clock size={14} />
                  {formatEpisodes(anime.episodes)}
                  {anime.duration ? ` · ${formatDuration(anime.duration)} ea` : ''}
                </div>
              )}
              {anime.popularity && (
                <div className="flex items-center gap-1.5 text-kuro-muted text-sm">
                  <Users size={14} />
                  {formatNum(anime.popularity)}
                </div>
              )}
              {anime.favourites && (
                <div className="flex items-center gap-1.5 text-kuro-muted text-sm">
                  <Heart size={14} />
                  {formatNum(anime.favourites)}
                </div>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-4">
              {anime.genres?.map(g => (
                <Link
                  key={g}
                  href={`/search?genres=${g}`}
                  className="text-xs px-3 py-1.5 rounded-full bg-kuro-surface border border-kuro-border text-kuro-muted hover:border-kuro-primary hover:text-kuro-primary transition-all"
                >
                  {g}
                </Link>
              ))}
            </div>

            {/* Studios */}
            {(anime.studios?.nodes?.length ?? 0) > 0 && (
              <p className="text-sm text-kuro-muted mb-3">
                <span className="text-kuro-dim">Studio:</span>{' '}
                <span className="text-kuro-text font-medium">
                  {anime.studios?.nodes?.filter(s => s.isAnimationStudio).map(s => s.name).join(', ')}
                </span>
              </p>
            )}

            {/* Synopsis */}
            <p className="text-kuro-muted text-sm leading-relaxed line-clamp-3 sm:line-clamp-none">
              {description || 'No synopsis available.'}
            </p>

            <Link
              href={`/watch/${playbackId}/${streamingEpisodeNumbers[0] || 1}`}
              className="inline-flex w-full items-center justify-center gap-2 mt-5 px-6 py-3 rounded-xl bg-kuro-primary hover:bg-kuro-primary-hover text-white font-semibold text-sm transition-all red-glow hover:red-glow-lg active:scale-95 sm:w-auto"
            >
              <Play size={18} className="fill-white" />
              {streamingEpisodeNumbers.length ? 'Watch Now' : 'Find Where to Watch'}
            </Link>
          </div>
        </div>

        {/* Trailer */}
        {anime.trailer?.id && anime.trailer.site === 'youtube' && (
          <div className="mt-8">
            <h2 className="font-display text-2xl text-kuro-text mb-4 tracking-wide flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-kuro-primary" />
              Trailer
            </h2>
            <div className="relative rounded-xl overflow-hidden aspect-video max-w-2xl bg-kuro-surface">
              <iframe
                src={`https://www.youtube.com/embed/${anime.trailer.id}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        )}

        <AnimeCommunityPanel animeId={anime.id} title={title} description={description} />
      </div>

      {/* Tabs */}
      <div ref={contentRef} className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex border-b border-kuro-border gap-1 mb-6 overflow-x-auto pb-1 mobile-scroll">
          {(['episodes', 'characters', 'related'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium capitalize whitespace-nowrap transition-colors relative',
                tab === t ? 'text-kuro-text tab-active' : 'text-kuro-dim hover:text-kuro-muted'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Episodes Tab */}
        {tab === 'episodes' && (
          <div>
            {visibleEpisodeNumbers.length > 0 ? (
              <>
                <div className="grid grid-cols-4 xs:grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 mb-6">
                  {visibleEpisodeNumbers.map(ep => (
                    <Link
                      key={ep}
                      href={`/watch/${playbackId}/${ep}`}
                      className="aspect-square min-h-12 flex items-center justify-center rounded-lg bg-kuro-surface border border-kuro-border text-sm font-medium text-kuro-muted hover:bg-kuro-primary hover:text-white hover:border-kuro-primary transition-all active:scale-95"
                    >
                      {ep}
                    </Link>
                  ))}
                </div>
                {!streamingEpisodeNumbers.length && totalEpPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEpisodePage(p => Math.max(1, p - 1))}
                      disabled={episodePage === 1}
                      className="p-2 rounded-lg bg-kuro-surface border border-kuro-border text-kuro-muted hover:text-white disabled:opacity-30 transition-all"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm text-kuro-muted">Page {episodePage} / {totalEpPages}</span>
                    <button
                      onClick={() => setEpisodePage(p => Math.min(totalEpPages, p + 1))}
                      disabled={episodePage === totalEpPages}
                      className="p-2 rounded-lg bg-kuro-surface border border-kuro-border text-kuro-muted hover:text-white disabled:opacity-30 transition-all"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-8 text-center">
                <p className="text-kuro-dim mb-4">The episode count is not published yet.</p>
                <Link
                  href={`/watch/${playbackId}/1`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-kuro-surface2 border border-kuro-border text-sm font-medium text-white hover:border-kuro-primary transition-colors"
                >
                  <Play size={16} /> Check episode availability
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Characters Tab */}
        {tab === 'characters' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {anime.characters?.edges?.map(edge => (
              <div key={edge.node.id} className="rounded-xl overflow-hidden bg-kuro-surface border border-kuro-border">
                <div className="relative h-36">
                  <Image
                    src={edge.node.image.large || edge.node.image.medium || ''}
                    alt={edge.node.name.full}
                    fill className="object-cover" unoptimized
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-kuro-surface to-transparent" />
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-kuro-text line-clamp-2">{edge.node.name.full}</p>
                  <p className="text-[10px] text-kuro-primary capitalize mt-0.5">{edge.role.toLowerCase()}</p>
                  {edge.voiceActorRoles?.[0] && (
                    <p className="text-[10px] text-kuro-dim mt-0.5 line-clamp-1">
                      CV: {edge.voiceActorRoles[0].voiceActor.name.full}
                    </p>
                  )}
                </div>
              </div>
            )) || <p className="text-kuro-dim text-sm col-span-full py-8 text-center">No character data available.</p>}
          </div>
        )}

        {/* Related Tab */}
        {tab === 'related' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {anime.relations?.edges?.map(edge => (
              <Link
                key={edge.node.id}
                href={`/anime/${edge.node.id}`}
                className="rounded-xl overflow-hidden bg-kuro-surface border border-kuro-border anime-card"
              >
                <div className="relative h-40">
                  <Image
                    src={edge.node.coverImage.medium || ''}
                    alt={getTitle(edge.node.title)} fill className="object-cover" unoptimized
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-kuro-surface to-transparent p-2">
                    <span className="text-[10px] text-kuro-primary font-medium">{edge.relationType.replace(/_/g, ' ')}</span>
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-medium text-kuro-text line-clamp-2">{getTitle(edge.node.title)}</p>
                  {edge.node.format && <p className="text-[10px] text-kuro-dim mt-0.5">{edge.node.format}</p>}
                </div>
              </Link>
            )) || <p className="text-kuro-dim text-sm col-span-full py-8 text-center">No related anime found.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailPageSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="h-80 skeleton" />
      <div className="max-w-screen-2xl mx-auto px-8 -mt-24 relative z-10">
        <div className="flex gap-8">
          <div className="w-52 skeleton rounded-xl aspect-[2/3]" />
          <div className="flex-1 space-y-4 pt-8">
            <div className="h-4 skeleton rounded-full w-32" />
            <div className="h-10 skeleton rounded-xl w-2/3" />
            <div className="h-4 skeleton rounded-full w-full" />
            <div className="h-4 skeleton rounded-full w-5/6" />
            <div className="h-4 skeleton rounded-full w-4/5" />
            <div className="h-12 skeleton rounded-xl w-36" />
          </div>
        </div>
      </div>
    </div>
  );
}
