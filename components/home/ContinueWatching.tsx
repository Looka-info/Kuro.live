'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Play } from 'lucide-react';
import gsap from 'gsap';
import { getWatchHistory, type WatchHistoryEntry } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export function ContinueWatching() {
  const [history, setHistory] = useState<WatchHistoryEntry[]>([]);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setHistory(getWatchHistory().slice(0, 6));
  }, []);

  useEffect(() => {
    if (!rootRef.current || !history.length) return;
    gsap.fromTo(rootRef.current.querySelectorAll('.continue-card'), { y: 28, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.7, ease: 'expo.out' });
  }, [history.length]);

  if (!history.length) return null;

  return (
    <section ref={rootRef} className="mb-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-screen-2xl">
        <div className="mb-6 flex items-end justify-between gap-5">
          <div>
            <div className="micro-label mb-3">resume signal</div>
            <h2 className="font-display text-5xl leading-none text-white sm:text-7xl">Continue Watching</h2>
          </div>
          <p className="hidden max-w-sm text-right text-sm text-kuro-muted sm:block">
            Your last sessions are staged as cinematic checkpoints.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {history.map(entry => {
            const pct = entry.duration ? Math.min((entry.progress / entry.duration) * 100, 100) : 0;
            return (
              <Link
                key={`${entry.animeId}-${entry.episode}`}
                href={`/watch/${entry.animeId}/${entry.episode}`}
                className="continue-card group block transition-all hover:-translate-y-1"
              >
                <Card className="overflow-hidden rounded-[2rem] bg-white/[0.035] p-2 transition-colors group-hover:border-white/20">
                <div className="relative h-48 overflow-hidden rounded-[1.55rem]">
                  <Image src={entry.image} alt={entry.title} fill className="object-cover transition duration-700 group-hover:scale-110" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
                  <Badge className="absolute left-4 top-4 gap-1.5 bg-black/60 text-white backdrop-blur">
                    <Clock size={12} /> Ep {entry.episode}
                  </Badge>
                  <div className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-black shadow-red-glow">
                      <Play size={20} className="fill-black" />
                    </span>
                  </div>
                  <div className="absolute inset-x-4 bottom-4">
                    <p className="line-clamp-2 text-lg font-bold leading-tight text-white">{entry.title}</p>
                    <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/15">
                      <div className="h-full rounded-full bg-kuro-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-kuro-muted">{Math.round(pct)}% watched</p>
                  </div>
                </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
