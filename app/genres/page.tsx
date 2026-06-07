import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { GENRES } from '@/lib/anilist';

export const metadata: Metadata = {
  title: 'Genres',
  description: 'Browse anime by mood, world, and genre.',
};

const genreNotes: Record<string, string> = {
  Action: 'Adrenaline, rivalries, and impossible odds.',
  Adventure: 'New worlds and roads worth getting lost on.',
  Comedy: 'Chaos, timing, and the perfect reaction shot.',
  Drama: 'Big feelings with nowhere left to hide.',
  Fantasy: 'Magic, myth, and worlds beyond the ordinary.',
  Horror: 'Dread that follows long after the credits.',
  Mystery: 'Clues, secrets, and one more episode.',
  Romance: 'Near misses, first confessions, lasting sparks.',
  'Sci-Fi': 'Future worlds and the questions inside them.',
  'Slice of Life': 'Small moments given room to matter.',
  Sports: 'Pressure, teamwork, and the final point.',
  Supernatural: 'The unseen stepping into everyday life.',
};

function genreSlug(genre: string) {
  return genre.toLowerCase().replace(/\s+/g, '-');
}

export default function GenresPage() {
  return (
    <div className="min-h-screen">
      <section className="page-hero pb-12">
        <div className="relative mx-auto max-w-screen-2xl" data-reveal>
          <p className="micro-label mb-5">Choose your frequency</p>
          <h1 className="font-display text-7xl leading-[0.82] text-white sm:text-[10rem]">Genres</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-kuro-muted">
            Follow a feeling. Pick a world. Let the night decide the rest.
          </p>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-screen-2xl gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {GENRES.map((genre, index) => (
            <Link
              key={genre}
              href={`/genre/${genreSlug(genre)}`}
              data-reveal
              className="content-card group relative min-h-56 overflow-hidden rounded-[2rem] p-6"
            >
              <span className="absolute right-5 top-5 font-mono text-xs text-white/20">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="absolute -bottom-20 -right-16 h-44 w-44 rounded-full bg-kuro-primary/10 blur-2xl transition-transform duration-700 group-hover:scale-150" />
              <div className="relative flex h-full flex-col justify-end">
                <h2 className="font-display text-5xl leading-none text-white">{genre}</h2>
                <p className="mt-3 min-h-10 text-sm leading-6 text-kuro-muted">
                  {genreNotes[genre] || `Stories shaped by ${genre.toLowerCase()}.`}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-kuro-primary">
                  Browse titles <ArrowUpRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
