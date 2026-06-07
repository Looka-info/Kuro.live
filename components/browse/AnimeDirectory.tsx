'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, LoaderCircle } from 'lucide-react';
import gsap from 'gsap';
import { AnimeCard, AnimeCardSkeleton } from '@/components/cards/AnimeCard';
import type { AniListMedia } from '@/lib/anilist';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';

interface AnimeDirectoryProps {
  title: string;
  eyebrow: string;
  description: string;
  query: Record<string, string>;
  ranked?: boolean;
}

const directoryLinks = [
  { href: '/trending', label: 'Trending' },
  { href: '/new-season', label: 'New Season' },
  { href: '/top-anime', label: 'Top Anime' },
  { href: '/browse', label: 'All Anime' },
  { href: '/categories', label: 'Categories' },
  { href: '/genres', label: 'Genres' },
];

export function AnimeDirectory({
  title,
  eyebrow,
  description,
  query,
  ranked = false,
}: AnimeDirectoryProps) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AniListMedia[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const stableQuery = useMemo(() => JSON.stringify(query), [query]);

  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [stableQuery]);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['anime-directory', stableQuery, page],
    queryFn: async () => {
      const params = new URLSearchParams(query);
      params.set('page', String(page));
      params.set('limit', '24');
      const response = await fetch(`/api/anime?${params.toString()}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Unable to load this collection.');
      return body as {
        media?: AniListMedia[];
        pageInfo?: { hasNextPage?: boolean; total?: number };
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!data?.media) return;
    const incoming = data.media;
    setItems(previous => {
      if (page === 1) return incoming;
      const existing = new Set(previous.map(item => String(item.id)));
      return [...previous, ...incoming.filter(item => !existing.has(String(item.id)))];
    });

    requestAnimationFrame(() => {
      if (!gridRef.current) return;
      gsap.fromTo(
        gridRef.current.querySelectorAll('.anime-card'),
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.55, stagger: 0.025, ease: 'power3.out' },
      );
    });
  }, [data, page]);

  const hasMore = data?.pageInfo?.hasNextPage ?? (data?.media?.length === 24);

  return (
    <main className="min-h-screen pb-24">
      <section className="page-hero pb-10">
        <div className="relative mx-auto max-w-screen-2xl">
          <p className="micro-label mb-5 text-kuro-primary">{eyebrow}</p>
          <h1 className="font-display text-6xl leading-[0.85] text-white xs:text-7xl sm:text-9xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-kuro-muted sm:text-lg">
            {description}
          </p>

          <div className="mobile-scroll mt-7 flex gap-2 overflow-x-auto pb-2">
            {directoryLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={buttonVariants({ variant: 'outline', size: 'sm', className: 'shrink-0 rounded-full' })}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-screen-2xl px-3 sm:px-6 lg:px-8">
        {data?.pageInfo?.total ? (
          <p className="micro-label mb-5">{data.pageInfo.total.toLocaleString()} titles</p>
        ) : null}

        <div
          ref={gridRef}
          className="grid grid-cols-2 gap-3 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7"
        >
          {isLoading && page === 1
            ? Array.from({ length: 21 }).map((_, index) => <AnimeCardSkeleton key={index} />)
            : items.map((anime, index) => (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
                  rank={ranked ? index + 1 : undefined}
                />
              ))}
        </div>

        {error && !items.length ? (
          <Card className="mt-6 p-8 text-center">
            <CardTitle>Collection unavailable</CardTitle>
            <CardDescription className="mt-2">{error.message}</CardDescription>
          </Card>
        ) : null}

        {!isLoading && !error && !items.length ? (
          <Card className="mt-6 p-8 text-center">
            <CardTitle>No titles found</CardTitle>
            <Link href="/browse" className={buttonVariants({ variant: 'link', className: 'mt-4 normal-case tracking-normal' })}>
              Browse all anime <ArrowUpRight size={15} />
            </Link>
          </Card>
        ) : null}

        {hasMore && items.length ? (
          <div className="mt-12 flex justify-center">
            <Button
              onClick={() => setPage(value => value + 1)}
              disabled={isFetching}
              className="min-w-44 rounded-full"
            >
              {isFetching ? <LoaderCircle size={16} className="animate-spin" /> : null}
              {isFetching ? 'Loading' : 'Load more'}
            </Button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
