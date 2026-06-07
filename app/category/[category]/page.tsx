import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AnimeDirectory } from '@/components/browse/AnimeDirectory';

const categories: Record<string, { title: string; description: string; query: Record<string, string> }> = {
  tv: { title: 'TV Anime', description: 'Full television anime series across every genre.', query: { type: 'all', format: 'TV' } },
  movies: { title: 'Anime Movies', description: 'Feature-length anime made for the big screen.', query: { type: 'all', format: 'MOVIE' } },
  ova: { title: 'OVA', description: 'Original video animation releases and side stories.', query: { type: 'all', format: 'OVA' } },
  ona: { title: 'ONA', description: 'Original net animation released for online audiences.', query: { type: 'all', format: 'ONA' } },
  specials: { title: 'Specials', description: 'Bonus episodes, television specials, and companion stories.', query: { type: 'all', format: 'SPECIAL' } },
  airing: { title: 'Currently Airing', description: 'Anime with new episodes still being released.', query: { type: 'all', status: 'RELEASING' } },
  completed: { title: 'Completed Anime', description: 'Finished series ready for a full marathon.', query: { type: 'all', status: 'FINISHED' } },
  upcoming: { title: 'Upcoming Anime', description: 'Announced anime and future premieres.', query: { type: 'all', status: 'NOT_YET_RELEASED' } },
};

export function generateMetadata({ params }: { params: { category: string } }): Metadata {
  const category = categories[params.category];
  return category
    ? { title: category.title, description: category.description }
    : { title: 'Anime Category' };
}

export default function CategoryPage({ params }: { params: { category: string } }) {
  const category = categories[params.category];
  if (!category) notFound();

  return (
    <AnimeDirectory
      eyebrow="Anime category"
      title={category.title}
      description={category.description}
      query={{ ...category.query, sort: 'POPULARITY_DESC' }}
    />
  );
}
