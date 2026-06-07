import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, BookmarkCheck, Compass, Moon, Play } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About',
  description: 'Meet Kuru.live, a cinematic home for anime discovery and late-night watching.',
};

const values = [
  {
    icon: Compass,
    title: 'Discovery with taste',
    copy: 'A focused catalog that helps you move from a familiar favorite to something unexpected.',
  },
  {
    icon: BookmarkCheck,
    title: 'Memory that stays',
    copy: 'Your list and watch progress keep every unfinished story ready for the next quiet night.',
  },
  {
    icon: Moon,
    title: 'Built for the mood',
    copy: 'A dark, spacious interface that lets artwork, sound, and story take over the room.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <section className="page-hero">
        <div className="relative mx-auto grid max-w-screen-2xl items-center gap-12 lg:grid-cols-[1fr_0.7fr]">
          <div data-reveal>
            <p className="micro-label mb-5">Our story</p>
            <h1 className="max-w-5xl font-display text-7xl leading-[0.88] text-white sm:text-9xl">
              Anime deserves a room of its own.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-kuro-muted">
              Kuru.live is a cinematic home for finding what to watch, keeping track of what matters,
              and returning to a story without losing the feeling that brought you there.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/search" className="neo-button inline-flex items-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.15em] text-black">
                Explore the catalog <ArrowUpRight size={17} />
              </Link>
              <Link data-magnetic href="/my-list" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-bold uppercase tracking-[0.15em] text-white">
                Open my list
              </Link>
            </div>
          </div>

          <div data-reveal className="relative mx-auto aspect-square w-full max-w-md">
            <div data-parallax="8" className="absolute inset-8 rounded-full bg-kuro-primary/20 blur-3xl" />
            <div className="content-card relative h-full overflow-hidden rounded-full p-5">
              <Image src="/logo.png" alt="Kuru.live" fill priority className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-screen-2xl gap-5 md:grid-cols-3">
          {values.map(({ icon: Icon, title, copy }) => (
            <article key={title} data-reveal className="content-card rounded-[2rem] p-7">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-kuro-primary/15 text-kuro-primary">
                <Icon size={21} />
              </div>
              <h2 className="mt-8 font-display text-4xl text-white">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-kuro-muted">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section data-reveal className="px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="content-card mx-auto max-w-4xl rounded-[2.5rem] px-6 py-16">
          <Play className="mx-auto text-kuro-primary" size={30} />
          <h2 className="mt-5 font-display text-6xl leading-none text-white sm:text-8xl">Press play. Stay awhile.</h2>
          <p className="mx-auto mt-5 max-w-xl text-kuro-muted">The next favorite is already waiting somewhere in the catalog.</p>
        </div>
      </section>
    </div>
  );
}
