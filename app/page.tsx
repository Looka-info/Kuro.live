'use client';

import { useQuery } from '@tanstack/react-query';
import { HeroBanner } from '@/components/home/HeroBanner';
import { AnimeShelf } from '@/components/home/AnimeShelf';
import { ContinueWatching } from '@/components/home/ContinueWatching';
import { KuruSignalPanel } from '@/components/home/KuruSignalPanel';
import type { AniListMedia } from '@/lib/anilist';
import { getCurrentSeason } from '@/lib/anilist';

async function fetchHomeData() {
  const { season, year } = getCurrentSeason();
  const [trending, popular, seasonal] = await Promise.all([
    fetch('/api/anime?type=trending&limit=20').then(r => r.json()),
    fetch('/api/anime?type=popular&limit=20').then(r => r.json()),
    fetch(`/api/anime?type=seasonal&season=${season}&year=${year}&limit=20`).then(r => r.json()),
  ]);
  return { trending, popular, seasonal, season, year };
}

export default function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['home'],
    queryFn: fetchHomeData,
    staleTime: 5 * 60 * 1000,
  });

  const trending: AniListMedia[] = data?.trending?.media || [];
  const popular: AniListMedia[] = data?.popular?.media || [];
  const seasonal: AniListMedia[] = data?.seasonal?.media || [];
  const seasonLabel = data
    ? `${data.season.charAt(0) + data.season.slice(1).toLowerCase()} ${data.year}`
    : 'This Season';

  return (
    <div className="awards-shell min-h-screen">
      <div className="orbital-bg" />
      <HeroBanner items={isLoading ? [] : trending.slice(0, 5)} />
      <KuruSignalPanel />

      <section data-reveal className="mb-24 overflow-hidden border-y border-white/10 bg-white/[0.025] py-5">
        <div className="marquee-track" data-scroll-shift="-22">
          {[...Array(2)].map((_, group) => (
            <div key={group} className="flex items-center gap-8 pr-8">
              {['SEAMLESS WATCHING', 'YOUR WATCHLIST', 'KURU LIVE'].map(label => (
                <span key={`${group}-${label}`} className="font-display text-5xl leading-none text-white/12 sm:text-7xl">
                  {label}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <div className="pb-4">
        <ContinueWatching />

        <AnimeShelf
          title="Trending Now"
          subtitle="The titles everyone is watching right now"
          anime={trending}
          isLoading={isLoading}
          viewAllHref="/trending"
          accentColor="#f5f5f7"
        />

        <AnimeShelf
          title={seasonLabel}
          subtitle="Fresh drops, weekly rituals, and new arcs"
          anime={seasonal}
          isLoading={isLoading}
          viewAllHref="/new-season"
          accentColor="#F5F5F5"
        />

        <AnimeShelf
          title="All-Time Greatest"
          subtitle="Ranked by score, staying power, and fan gravity"
          anime={popular.slice(0, 16)}
          isLoading={isLoading}
          viewAllHref="/top-anime"
          showRank
          accentColor="#a1a1aa"
        />
      </div>
    </div>
  );
}
