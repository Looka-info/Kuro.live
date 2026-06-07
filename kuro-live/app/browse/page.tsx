import type { Metadata } from 'next';
import { AnimeDirectory } from '@/components/browse/AnimeDirectory';

export const metadata: Metadata = {
  title: 'All Anime',
  description: 'Browse the full anime directory.',
};

export default function BrowsePage() {
  return (
    <AnimeDirectory
      eyebrow="Complete directory"
      title="All Anime"
      description="Explore television series, movies, shorts, originals, specials, and more."
      query={{ type: 'all', sort: 'POPULARITY_DESC' }}
    />
  );
}
