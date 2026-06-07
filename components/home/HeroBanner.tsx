'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Bookmark, BookmarkCheck, Play, Star } from 'lucide-react';
import gsap from 'gsap';
import anime from 'animejs';
import { cn, formatEpisodes, formatScore, getBestImage, getTitle, stripHtml, truncate } from '@/lib/utils';
import { useWatchlistStore } from '@/store';
import type { AniListMedia } from '@/lib/anilist';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';

interface HeroBannerProps {
  items: AniListMedia[];
}

export function HeroBanner({ items }: HeroBannerProps) {
  const [current, setCurrent] = useState(0);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { add, remove, isInList } = useWatchlistStore();

  const featured = items[current];
  const inList = featured ? isInList(featured.id) : false;

  const animateIn = useCallback(() => {
    if (!copyRef.current || !mediaRef.current) return;
    gsap.fromTo(copyRef.current.children, { y: 42, opacity: 0, filter: 'blur(12px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9, stagger: 0.055, ease: 'expo.out' });
    gsap.fromTo(mediaRef.current.children, { scale: 1.08, opacity: 0, y: 28 }, { scale: 1, opacity: 1, y: 0, duration: 1, stagger: 0.08, ease: 'expo.out' });
  }, []);

  const animateOut = useCallback((done: () => void) => {
    if (!copyRef.current || !mediaRef.current) return done();
    gsap.to([...Array.from(copyRef.current.children), ...Array.from(mediaRef.current.children)], {
      y: -22,
      opacity: 0,
      filter: 'blur(10px)',
      duration: 0.28,
      stagger: 0.018,
      ease: 'power2.in',
      onComplete: done,
    });
  }, []);

  const goTo = useCallback((index: number) => {
    if (!items.length || busy || index === current) return;
    setBusy(true);
    animateOut(() => {
      setCurrent(index);
      requestAnimationFrame(() => {
        animateIn();
        setTimeout(() => setBusy(false), 520);
      });
    });
  }, [animateIn, animateOut, busy, current, items.length]);

  useEffect(() => {
    if (!rootRef.current) return;
    gsap.fromTo(rootRef.current, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out' });
    animateIn();
  }, [animateIn]);

  useEffect(() => {
    if (!items.length) return;
    intervalRef.current = setInterval(() => goTo((current + 1) % items.length), 7200);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [current, goTo, items.length]);

  useEffect(() => {
    if (!railRef.current) return;
    anime.remove(railRef.current.querySelectorAll('.hero-progress'));
    railRef.current.querySelectorAll('.hero-progress').forEach((node, index) => {
      anime({
        targets: node,
        width: index === current ? ['0%', '100%'] : '0%',
        duration: index === current ? 7200 : 0,
        easing: 'linear',
      });
    });
  }, [current]);

  const restart = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => goTo((current + 1) % items.length), 7200);
  };

  const handleWatchlist = () => {
    if (!featured) return;
    const title = getTitle(featured.title);
    const image = getBestImage(featured.coverImage);
    if (inList) remove(featured.id);
    else add({ id: featured.id, title, image, status: 'plan_to_watch', progress: 0, totalEpisodes: featured.episodes ?? undefined });
  };

  if (!items.length || !featured) return <HeroBannerSkeleton />;

  const title = getTitle(featured.title);
  const description = truncate(stripHtml(featured.description), 220);
  const poster = getBestImage(featured.coverImage);
  const backdrop = featured.bannerImage || poster;
  const sideItems = items.filter((_, index) => index !== current).slice(0, 3);

  return (
    <section ref={rootRef} className="relative min-h-[100svh] overflow-hidden px-4 pb-12 pt-24 sm:px-6 sm:pt-28 lg:px-8">
      <div className="absolute inset-0">
        <Image data-parallax="4" src={backdrop} alt="" fill priority className="object-cover opacity-35 blur-[2px] scale-110" unoptimized />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_15%,rgba(255,255,255,0.10),transparent_28%),linear-gradient(90deg,#050505_0%,rgba(5,5,5,0.92)_42%,rgba(5,5,5,0.62)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#050505] to-transparent" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100svh-7rem)] max-w-screen-2xl items-center gap-10 lg:min-h-[calc(100vh-8rem)] lg:grid-cols-[1.05fr_0.95fr]">
        <div ref={copyRef} className="max-w-4xl">
          <div className="micro-label inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-kuro-primary shadow-red-glow" />
            A curated cinematic feed
          </div>

          <h1 className="mt-5 max-w-5xl font-display text-[clamp(4.2rem,18vw,7.5rem)] leading-[0.82] tracking-[-0.05em] text-white sm:mt-6 sm:text-[8.8rem] sm:leading-[0.78] lg:text-[10.5rem]">
            {title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {featured.averageScore && (
              <Badge variant="outline" className="gap-1.5 border-yellow-400/20 bg-yellow-400/10 text-yellow-300">
                <Star size={14} className="fill-yellow-300" /> {formatScore(featured.averageScore)}
              </Badge>
            )}
            {featured.episodes && <Badge variant="muted">{formatEpisodes(featured.episodes)}</Badge>}
            {featured.genres?.slice(0, 3).map(genre => (
              <Badge key={genre} variant="outline" className="bg-black/35 text-kuro-muted backdrop-blur">
                {genre}
              </Badge>
            ))}
          </div>

          <p className="mt-6 max-w-2xl text-balance text-base leading-8 text-kuro-muted sm:text-lg">
            {description || 'A high-contrast anime discovery interface built for momentum, mood, and late-night marathons.'}
          </p>

          <div className="mt-8 flex flex-col items-stretch gap-3 xs:flex-row xs:flex-wrap xs:items-center">
            <Link href={`/watch/${featured.id}/1`} className={buttonVariants({ size: 'lg', className: 'rounded-full shadow-red-glow hover:scale-[1.02]' })}>
              <Play size={18} className="fill-black" /> Play episode
            </Link>
            <Link data-magnetic href={`/anime/${featured.id}`} className={buttonVariants({ variant: 'outline', size: 'lg', className: 'rounded-full backdrop-blur' })}>
              Details <ArrowUpRight size={16} />
            </Link>
            <button onClick={handleWatchlist} className={buttonVariants({ variant: inList ? 'secondary' : 'outline', size: 'lg', className: 'rounded-full' })}>
              {inList ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              {inList ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        <div ref={mediaRef} className="relative hidden min-h-[690px] lg:block">
          <div className="absolute right-20 top-8 h-[610px] w-[410px] rotate-2 overflow-hidden rounded-[3rem] border border-white/10 bg-white/[0.035] p-3 shadow-card-hover">
            <div className="poster-mask relative h-full overflow-hidden rounded-[2.35rem]">
              <Image src={poster} alt={title} fill priority className="object-cover" unoptimized />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </div>
          </div>

          {sideItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => { goTo(items.findIndex(candidate => candidate.id === item.id)); restart(); }}
              className={cn(
                'absolute left-0 w-44 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-2 text-left shadow-card transition-transform hover:-translate-y-2',
                index === 0 && 'top-20 rotate-[-8deg]',
                index === 1 && 'bottom-28 left-10 rotate-[7deg]',
                index === 2 && 'right-0 left-auto bottom-8 rotate-[-5deg]',
              )}
            >
              <div className="relative aspect-[0.72] overflow-hidden rounded-[1.45rem]">
                <Image src={getBestImage(item.coverImage)} alt={getTitle(item.title)} fill className="object-cover" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                <p className="absolute inset-x-3 bottom-3 line-clamp-2 text-xs font-bold text-white">{getTitle(item.title)}</p>
              </div>
            </button>
          ))}

          <div className="absolute bottom-14 right-10 rounded-[2rem] border border-white/10 bg-black/50 p-5 backdrop-blur-xl">
            <p className="micro-label">currently transmitting</p>
            <p className="mt-2 font-display text-5xl text-white">{String(current + 1).padStart(2, '0')}</p>
          </div>
        </div>
      </div>

      <div ref={railRef} className="relative mx-auto mt-2 flex max-w-screen-2xl gap-2">
        {items.slice(0, 5).map((item, index) => (
          <button
            key={item.id}
            onClick={() => { goTo(index); restart(); }}
            className="h-1 flex-1 overflow-hidden rounded-full bg-white/12"
            aria-label={`Go to ${getTitle(item.title)}`}
          >
            <span className="hero-progress block h-full w-0 rounded-full bg-kuro-primary" />
          </button>
        ))}
      </div>
    </section>
  );
}

function HeroBannerSkeleton() {
  return (
    <section className="relative min-h-[100svh] px-4 pb-12 pt-24 sm:px-6 sm:pt-28 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100svh-7rem)] max-w-screen-2xl items-center gap-10 lg:min-h-[calc(100vh-8rem)] lg:grid-cols-2">
        <div className="space-y-5">
          <div className="h-10 w-56 rounded-full skeleton" />
          <div className="h-28 w-full max-w-3xl rounded-[2rem] skeleton" />
          <div className="h-5 w-4/5 rounded-full skeleton" />
          <div className="h-5 w-2/3 rounded-full skeleton" />
          <div className="flex gap-3">
            <div className="h-14 w-44 rounded-full skeleton" />
            <div className="h-14 w-36 rounded-full skeleton" />
          </div>
        </div>
        <div className="hidden h-[620px] rounded-[3rem] skeleton lg:block" />
      </div>
    </section>
  );
}
