'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center px-4 py-24 sm:py-32">
      <section className="content-card w-full max-w-2xl rounded-[2.5rem] px-6 py-16 text-center">
        <p className="micro-label">The scene skipped</p>
        <h1 className="mt-4 font-display text-7xl leading-none text-white sm:text-8xl">Something went quiet.</h1>
        <p className="mx-auto mt-5 max-w-lg leading-7 text-kuro-muted">
          Try the scene again. Your saved list and progress are still here.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <button onClick={reset} className="neo-button inline-flex items-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.15em] text-black">
            <RefreshCw size={17} /> Try again
          </button>
          <Link href="/" className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-bold uppercase tracking-[0.15em] text-white">
            Go home
          </Link>
        </div>
      </section>
    </main>
  );
}
