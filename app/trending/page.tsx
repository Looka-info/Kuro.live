import type { Metadata } from 'next';
import { AnimeDirectory } from '@/components/browse/AnimeDirectory';

export const metadata: Metadata = {
  title: 'Trending Anime',
  description: 'Explore the anime getting the most attention right now.',
};

export default function TrendingPage() {
  return (
    <AnimeDirectory
      eyebrow="Live popularity signal"
      title="Trending"
      description="The series and films gaining momentum across the anime community right now."
      query={{ type: 'all', sort: 'TRENDING_DESC' }}
    />
  );
}
