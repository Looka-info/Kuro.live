import type { Metadata } from 'next';
import { AnimeDirectory } from '@/components/browse/AnimeDirectory';

function genreName(value: string) {
  return decodeURIComponent(value)
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .replace('Sci Fi', 'Sci-Fi');
}

export function generateMetadata({ params }: { params: { genre: string } }): Metadata {
  const genre = genreName(params.genre);
  return { title: `${genre} Anime`, description: `Browse ${genre} anime.` };
}

export default function GenrePage({ params }: { params: { genre: string } }) {
  const genre = genreName(params.genre);
  return (
    <AnimeDirectory
      eyebrow="Genre collection"
      title={genre}
      description={`Explore popular, new, and highly rated ${genre.toLowerCase()} anime.`}
      query={{ type: 'all', genres: genre, sort: 'POPULARITY_DESC' }}
    />
  );
}
