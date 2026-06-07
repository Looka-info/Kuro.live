import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { GENRES } from '@/lib/anilist';

export const metadata: Metadata = {
  title: 'Anime Categories',
  description: 'Browse anime by format, release status, and genre.',
};

const categories = [
  { href: '/category/tv', title: 'TV Anime', note: 'Series made for weekly television.' },
  { href: '/category/movies', title: 'Movies', note: 'Feature-length anime cinema.' },
  { href: '/category/ova', title: 'OVA', note: 'Original video animation releases.' },
  { href: '/category/ona', title: 'ONA', note: 'Anime created for online release.' },
  { href: '/category/specials', title: 'Specials', note: 'Bonus episodes and side stories.' },
  { href: '/category/airing', title: 'Airing', note: 'Series releasing new episodes now.' },
  { href: '/category/completed', title: 'Completed', note: 'Finished stories ready to marathon.' },
  { href: '/category/upcoming', title: 'Upcoming', note: 'Announced and future premieres.' },
];

function genreSlug(genre: string) {
  return genre.toLowerCase().replace(/\s+/g, '-');
}

export default function CategoriesPage() {
  return (
    <main className="min-h-screen pb-24">
      <section className="page-hero pb-12">
        <div className="relative mx-auto max-w-screen-2xl">
          <p className="micro-label mb-5 text-kuro-primary">Complete anime index</p>
          <h1 className="font-display text-6xl leading-[0.85] text-white xs:text-7xl sm:text-9xl">
            Categories
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-kuro-muted sm:text-lg">
            Browse the catalog by release type, current status, or genre.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, index) => (
            <Link
              key={category.href}
              href={category.href}
              data-reveal
              className="content-card group relative min-h-48 overflow-hidden rounded-[2rem] p-6"
            >
              <span className="font-mono text-xs text-white/25">{String(index + 1).padStart(2, '0')}</span>
              <div className="mt-12">
                <h2 className="font-display text-4xl text-white">{category.title}</h2>
                <p className="mt-2 text-sm leading-6 text-kuro-muted">{category.note}</p>
                <ArrowUpRight className="absolute bottom-6 right-6 text-kuro-primary transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" size={18} />
              </div>
            </Link>
          ))}
        </div>

        <div className="mb-5 mt-16 flex items-end justify-between gap-4">
          <div>
            <p className="micro-label text-kuro-primary">Story frequencies</p>
            <h2 className="mt-2 font-display text-5xl text-white sm:text-7xl">Genres</h2>
          </div>
          <Link href="/genres" className="text-xs font-bold uppercase tracking-[0.14em] text-kuro-primary">
            Genre guide
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {GENRES.map(genre => (
            <Link
              key={genre}
              href={`/genre/${genreSlug(genre)}`}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-kuro-muted hover:border-kuro-primary/50 hover:bg-kuro-primary/10 hover:text-white"
            >
              {genre}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
