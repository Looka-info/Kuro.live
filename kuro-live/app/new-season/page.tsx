import type { Metadata } from 'next';
import { AnimeDirectory } from '@/components/browse/AnimeDirectory';
import { getCurrentSeason } from '@/lib/anilist';

export const metadata: Metadata = {
  title: 'New Season Anime',
  description: 'Browse anime from the current broadcast season.',
};

export default function NewSeasonPage() {
  const { season, year } = getCurrentSeason();
  const label = `${season.charAt(0)}${season.slice(1).toLowerCase()} ${year}`;

  return (
    <AnimeDirectory
      eyebrow={label}
      title="New Season"
      description={`Fresh premieres, continuing weekly series, and new stories from ${label}.`}
      query={{ type: 'seasonal', season, year: String(year) }}
    />
  );
}
