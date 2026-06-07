'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bookmark, BookmarkCheck, Play, Star } from 'lucide-react';
import gsap from 'gsap';
import { cn, formatEpisodes, formatScore, getBestImage, getTitle, truncate } from '@/lib/utils';
import { useWatchlistStore } from '@/store';
import type { AniListMedia } from '@/lib/anilist';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface AnimeCardProps {
  anime: AniListMedia;
  size?: 'sm' | 'md' | 'lg';
  rank?: number;
}

export function AnimeCard({ anime, size = 'md', rank }: AnimeCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const { add, remove, isInList } = useWatchlistStore();
  const inList = isInList(anime.id);
  const title = getTitle(anime.title);
  const image = getBestImage(anime.coverImage);

  const sizes = {
    sm: 'w-36 sm:w-40',
    md: 'w-40 xs:w-44 sm:w-52',
    lg: 'w-48 xs:w-56 sm:w-64',
  };

  const handleMove = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const card = cardRef.current;
    const shine = shineRef.current;
    if (!card || !shine) return;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateY = ((x / rect.width) - 0.5) * 12;
    const rotateX = -((y / rect.height) - 0.5) * 10;

    gsap.to(card, { rotateX, rotateY, transformPerspective: 900, duration: 0.35, ease: 'power3.out' });
    gsap.to(shine, { x: x - rect.width / 2, y: y - rect.height / 2, opacity: 1, duration: 0.35, ease: 'power3.out' });
  };

  const handleLeave = () => {
    if (!cardRef.current || !shineRef.current) return;
    gsap.to(cardRef.current, { rotateX: 0, rotateY: 0, duration: 0.55, ease: 'elastic.out(1, .55)' });
    gsap.to(shineRef.current, { opacity: 0, duration: 0.35 });
  };

  const handleWatchlist = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (inList) {
      remove(anime.id);
      toast('Removed from watchlist');
      return;
    }

    add({
      id: anime.id,
      title,
      image,
      status: 'plan_to_watch',
      progress: 0,
      totalEpisodes: anime.episodes ?? undefined,
    });
    toast.success('Added to watchlist');
  };

  return (
    <Link
      ref={cardRef}
      href={`/anime/${anime.id}`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={cn('anime-card group block flex-shrink-0 rounded-[2rem] outline-none', sizes[size])}
    >
      <article className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] p-2 shadow-card">
        <div ref={shineRef} className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-32 w-32 rounded-full bg-white/20 opacity-0 blur-3xl" />

        <div className="poster-mask relative aspect-[0.72] overflow-hidden rounded-[1.55rem] bg-kuro-surface">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 180px, 260px"
            className="object-cover transition duration-700 group-hover:scale-110"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/22 to-transparent opacity-95" />
          <div className="absolute inset-0 bg-kuru-slice opacity-0 transition-opacity duration-500 group-hover:opacity-80" />

          {rank && (
            <Badge variant="outline" className="absolute left-3 top-3 border-white/15 bg-black/50 font-mono text-white backdrop-blur">
              #{String(rank).padStart(2, '0')}
            </Badge>
          )}

          <button
            onClick={handleWatchlist}
            className={cn(
              'absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-white/10 backdrop-blur transition-all',
              inList ? 'bg-kuro-primary text-white' : 'bg-black/45 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-kuro-primary',
            )}
            aria-label={inList ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            {inList ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
          </button>

          <div className="absolute inset-x-4 bottom-4">
            <div className="mb-3 flex items-center justify-between">
              {anime.averageScore ? (
                <Badge variant="outline" className="gap-1 border-yellow-400/20 bg-yellow-400/10 text-yellow-300">
                  <Star size={11} className="fill-yellow-300" /> {formatScore(anime.averageScore)}
                </Badge>
              ) : <span />}
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-black opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 scale-75">
                <Play size={17} className="fill-black" />
              </span>
            </div>
            <h3 className="text-balance text-sm font-bold leading-tight text-white sm:text-base">
              {truncate(title, 46)}
            </h3>
          </div>
        </div>

        <div className="px-2 pb-2 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {anime.format && <Badge variant="muted" className="font-mono">{anime.format}</Badge>}
            {anime.episodes && <span className="text-[11px] text-kuro-muted">{formatEpisodes(anime.episodes)}</span>}
            {anime.seasonYear && <span className="text-[11px] text-kuro-dim">{anime.seasonYear}</span>}
          </div>
          {anime.genres?.length ? (
            <div className="mt-2 flex gap-1 overflow-hidden">
              {anime.genres.slice(0, 2).map(genre => (
                <Badge key={genre} variant="muted" className="border-white/8 px-2 py-0.5 text-[10px] normal-case tracking-normal">
                  {genre}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </article>
    </Link>
  );
}

export function AnimeCardSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const widths = { sm: 'w-36 sm:w-40', md: 'w-40 xs:w-44 sm:w-52', lg: 'w-48 xs:w-56 sm:w-64' };
  return (
    <div className={cn('anime-card-skeleton flex-shrink-0 rounded-[2rem] border border-white/8 bg-white/[0.035] p-2', widths[size])}>
      <Skeleton className="aspect-[0.72] rounded-[1.55rem]" />
      <div className="space-y-2 px-2 pb-2 pt-3">
        <Skeleton className="h-3 w-4/5 rounded-full" />
        <Skeleton className="h-3 w-3/5 rounded-full" />
      </div>
    </div>
  );
}
