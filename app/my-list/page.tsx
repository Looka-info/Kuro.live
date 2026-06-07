'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useWatchlistStore } from '@/store';
import { getWatchHistory, type WatchHistoryEntry, type WatchlistEntry } from '@/lib/utils';
import { Play, Trash2, Clock } from 'lucide-react';
import gsap from 'gsap';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type Tab = 'watchlist' | 'history';

export default function MyListPage() {
  const [tab, setTab] = useState<Tab>('watchlist');
  const [history, setHistory] = useState<WatchHistoryEntry[]>([]);
  const { items, remove, updateStatus } = useWatchlistStore();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistory(getWatchHistory());
  }, []);

  useEffect(() => {
    if (listRef.current) {
      const cards = listRef.current.children;
      gsap.fromTo(
        cards,
        { opacity: 0, scale: 0.95, y: 10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'back.out(1.2)' }
      );
    }
  }, [tab, items.length, history.length]); // Re-run animation when tab or items change

  const handleRemoveWatchlist = (id: number | string) => {
    remove(id);
    toast('Removed from watchlist');
  };

  const handleRemoveHistory = (animeId: number | string, episode: number) => {
    const key = `kuro_history_${animeId}_${episode}`;
    localStorage.removeItem(key);
    setHistory(getWatchHistory());
    toast('Removed from history');
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto">
      <h1 className="font-display text-4xl sm:text-5xl text-kuro-text mb-8 tracking-wide">
        My List
      </h1>

      {/* Tabs */}
      <div className="mobile-scroll flex items-center gap-2 mb-8 overflow-x-auto border-b border-kuro-border pb-1">
        <button
          onClick={() => setTab('watchlist')}
          className={cn(
            'whitespace-nowrap px-5 py-2.5 rounded-t-lg font-medium transition-all relative sm:px-6',
            tab === 'watchlist' ? 'text-white tab-active' : 'text-kuro-muted hover:text-white'
          )}
        >
          Watchlist
          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-kuro-surface2 text-kuro-muted">{items.length}</span>
        </button>
        <button
          onClick={() => setTab('history')}
          className={cn(
            'whitespace-nowrap px-5 py-2.5 rounded-t-lg font-medium transition-all relative sm:px-6',
            tab === 'history' ? 'text-white tab-active' : 'text-kuro-muted hover:text-white'
          )}
        >
          History
          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-kuro-surface2 text-kuro-muted">{history.length}</span>
        </button>
      </div>

      <div ref={listRef} className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {/* Watchlist */}
        {tab === 'watchlist' && (
          items.length > 0 ? items.map(item => (
            <div key={item.id} className="relative rounded-xl overflow-hidden bg-kuro-surface border border-kuro-border anime-card group">
              <Link href={`/anime/${item.id}`} className="block relative aspect-[2/3]">
                <Image src={item.image} alt={item.title} fill className="object-cover" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" />
              </Link>
              
              <button
                onClick={() => handleRemoveWatchlist(item.id)}
                className="absolute top-2 right-2 p-1.5 rounded bg-black/60 text-white hover:bg-white hover:text-black transition-colors opacity-100 backdrop-blur-md sm:opacity-0 sm:group-hover:opacity-100"
                title="Remove from list"
              >
                <Trash2 size={14} />
              </button>

              <div className="p-2 sm:p-3 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent translate-y-0 transition-transform sm:translate-y-full sm:group-hover:translate-y-0">
                <p className="text-xs font-medium text-white line-clamp-1">{item.title}</p>
                <div className="mt-2 flex items-center gap-1">
                  <select
                    value={item.status}
                    onChange={(e) => updateStatus(item.id, e.target.value as WatchlistEntry['status'])}
                    className="w-full bg-kuro-surface2 text-white text-[10px] rounded px-1 py-1 outline-none border border-kuro-border focus:border-kuro-primary"
                  >
                    <option value="plan_to_watch">Plan to Watch</option>
                    <option value="watching">Watching</option>
                    <option value="completed">Completed</option>
                    <option value="dropped">Dropped</option>
                  </select>
                </div>
              </div>
              {/* Fallback info when not hovered */}
              <div className="hidden p-3 bg-kuro-surface group-hover:opacity-0 transition-opacity absolute bottom-0 left-0 right-0 sm:block">
                <p className="text-xs font-medium text-kuro-text line-clamp-1">{item.title}</p>
                <p className="text-[10px] text-kuro-primary capitalize mt-0.5">{item.status.replace(/_/g, ' ')}</p>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center text-kuro-muted flex flex-col items-center">
              <div className="text-5xl mb-4">🔖</div>
              <p>Your watchlist is empty.</p>
              <Link href="/search" className="text-kuro-primary hover:underline mt-2">Find something to watch</Link>
            </div>
          )
        )}

        {/* History */}
        {tab === 'history' && (
          history.length > 0 ? history.map(entry => {
            const pct = entry.duration ? Math.min((entry.progress / entry.duration) * 100, 100) : 0;
            return (
              <div key={`${entry.animeId}-${entry.episode}`} className="relative rounded-xl overflow-hidden bg-kuro-surface border border-kuro-border anime-card group aspect-video">
                <Link href={`/watch/${entry.animeId}/${entry.episode}`} className="block relative w-full h-full">
                  <Image src={entry.image} alt={entry.title} fill className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors" />
                  
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-kuro-primary flex items-center justify-center opacity-100 group-hover:opacity-100 transition-all scale-100 sm:opacity-0 sm:scale-75 sm:group-hover:scale-100">
                    <Play size={16} className="fill-white text-white ml-0.5" />
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/80">
                    <div className="h-full bg-kuro-primary" style={{ width: `${pct}%` }} />
                  </div>

                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 rounded px-1.5 py-0.5 text-[10px] text-white">
                    <Clock size={10} /> Ep {entry.episode}
                  </div>
                </Link>

                <button
                  onClick={() => handleRemoveHistory(entry.animeId, entry.episode)}
                  className="absolute top-2 right-2 p-1.5 rounded bg-black/70 text-white hover:bg-white hover:text-black transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  title="Remove from history"
                >
                  <Trash2 size={12} />
                </button>

                <div className="absolute bottom-2 left-2 right-2 pointer-events-none">
                  <p className="text-xs font-medium text-white line-clamp-1 drop-shadow-md">{entry.title}</p>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-full py-20 text-center text-kuro-muted flex flex-col items-center">
              <div className="text-5xl mb-4">⏱️</div>
              <p>Your watch history is empty.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
