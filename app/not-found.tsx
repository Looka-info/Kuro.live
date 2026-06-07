import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-24 sm:py-32">
      <section data-reveal className="content-card relative w-full max-w-3xl overflow-hidden rounded-[2.5rem] px-6 py-16 text-center sm:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.12),transparent_35%)]" />
        <div className="relative">
          <Image src="/logo.png" alt="" width={90} height={90} className="mx-auto rounded-full shadow-red-ring" />
          <p className="micro-label mt-7">404 / signal lost</p>
          <h1 className="mt-4 font-display text-7xl leading-none text-white sm:text-9xl">This scene does not exist.</h1>
          <p className="mx-auto mt-5 max-w-lg leading-7 text-kuro-muted">
            The page may have moved, or the path belongs to another timeline.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/" className="neo-button inline-flex items-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.15em] text-black">
              <ArrowLeft size={17} /> Back home
            </Link>
            <Link data-magnetic href="/search" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-bold uppercase tracking-[0.15em] text-white">
              <Search size={17} /> Search
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
