'use client';

import { useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import { AnimeCard, AnimeCardSkeleton } from '@/components/cards/AnimeCard';
import type { AniListMedia } from '@/lib/anilist';
import { Button, buttonVariants } from '@/components/ui/button';

interface AnimeShelfProps {
  title: string;
  subtitle?: string;
  anime?: AniListMedia[];
  isLoading?: boolean;
  viewAllHref?: string;
  showRank?: boolean;
  cardSize?: 'sm' | 'md' | 'lg';
  accentColor?: string;
}

export function AnimeShelf({
  title,
  subtitle,
  anime = [],
  isLoading = false,
  viewAllHref,
  showRank = false,
  cardSize = 'md',
  accentColor = '#a1a1aa',
}: AnimeShelfProps) {
  const shelfRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shelfRef.current || isLoading) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || !shelfRef.current) return;
      const cards = shelfRef.current.querySelectorAll('.anime-card');
      gsap.fromTo(
        shelfRef.current.querySelectorAll('.shelf-kicker, .shelf-title, .shelf-copy, .shelf-action'),
        { y: 26, opacity: 0, filter: 'blur(10px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9, stagger: 0.06, ease: 'expo.out' },
      );
      gsap.fromTo(cards, { y: 50, opacity: 0, rotate: 1.5 }, { y: 0, opacity: 1, rotate: 0, duration: 0.8, stagger: 0.055, ease: 'expo.out', delay: 0.15 });
      observer.disconnect();
    }, { threshold: 0.16 });
    observer.observe(shelfRef.current);
    return () => observer.disconnect();
  }, [isLoading, anime]);

  const scroll = useCallback((dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = Math.min(720, window.innerWidth * 0.72);
    gsap.to(scrollRef.current, {
      scrollLeft: scrollRef.current.scrollLeft + (dir === 'right' ? amount : -amount),
      duration: 0.85,
      ease: 'power3.out',
    });
  }, []);

  return (
    <section ref={shelfRef} className="relative mb-20 overflow-hidden px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-screen-2xl">
        <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="shelf-kicker micro-label mb-3 flex items-center gap-3">
              <span className="h-px w-10" style={{ background: accentColor }} />
              curated transmission
            </div>
            <h2 className="shelf-title font-display text-5xl leading-none text-white sm:text-7xl">
              {title}
            </h2>
            {subtitle && <p className="shelf-copy mt-2 max-w-xl text-sm text-kuro-muted sm:text-base">{subtitle}</p>}
          </div>

          <div className="shelf-action flex w-full items-center gap-2 sm:w-auto">
            {viewAllHref && (
              <Link
                href={viewAllHref}
                className={buttonVariants({ className: 'flex-1 rounded-full px-5 py-3 text-xs hover:scale-[1.02] sm:flex-none' })}
              >
                Explore all <ArrowUpRight size={15} />
              </Link>
            )}
            <Button variant="outline" size="icon" onClick={() => scroll('left')} className="shrink-0 rounded-full" aria-label="Scroll left">
              <ChevronLeft size={18} />
            </Button>
            <Button variant="outline" size="icon" onClick={() => scroll('right')} className="shrink-0 rounded-full" aria-label="Scroll right">
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>

        <div ref={scrollRef} className="shelf-scroll -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          {isLoading
            ? Array.from({ length: 9 }).map((_, index) => <AnimeCardSkeleton key={index} size={cardSize} />)
            : anime.map((item, index) => (
                <AnimeCard
                  key={item.id}
                  anime={item}
                  size={cardSize}
                  rank={showRank ? index + 1 : undefined}
                />
              ))}
        </div>
      </div>
    </section>
  );
}
