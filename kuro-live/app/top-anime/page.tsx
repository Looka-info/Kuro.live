import type { Metadata } from 'next';
import { AnimeDirectory } from '@/components/browse/AnimeDirectory';

export const metadata: Metadata = {
  title: 'Top Anime',
  description: 'Browse the highest-rated anime.',
};

export default function TopAnimePage() {
  return (
    <AnimeDirectory
      eyebrow="Community score archive"
      title="Top Anime"
      description="The highest-rated anime series, movies, OVAs, and specials in one ranked collection."
      query={{ type: 'top' }}
      ranked
    />
  );
}
