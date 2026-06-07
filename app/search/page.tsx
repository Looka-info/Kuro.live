'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, Suspense } from 'react';
import { Search, SlidersHorizontal, X, ChevronDown, LayoutGrid, List } from 'lucide-react';
import { AnimeCard, AnimeCardSkeleton } from '@/components/cards/AnimeCard';
import { GENRES, type AniListMedia } from '@/lib/anilist';
import { cn } from '@/lib/utils';
import gsap from 'gsap';

const SORT_OPTIONS = [
  { value: 'TRENDING_DESC', label: 'Trending' },
  { value: 'POPULARITY_DESC', label: 'Most Popular' },
  { value: 'SCORE_DESC', label: 'Highest Rated' },
  { value: 'START_DATE_DESC', label: 'Newest' },
  { value: 'SEARCH_MATCH', label: 'Relevance' },
];

const STATUS_OPTIONS = ['RELEASING', 'FINISHED', 'NOT_YET_RELEASED', 'CANCELLED'];
const FORMAT_OPTIONS = ['TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL', 'MUSIC'];

function SearchPageInner() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const sortParam = searchParams.get('sort') || 'TRENDING_DESC';
  const genresParam = searchParams.get('genres') || '';
  const filterParam = searchParams.get('filter') || '';

  const [query, setQuery] = useState(q);
  const [debouncedQuery, setDebouncedQuery] = useState(q);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(genresParam ? genresParam.split(',') : []);
  const [sortBy, setSortBy] = useState(sortParam);
  const [status, setStatus] = useState('');
  const [format, setFormat] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [allResults, setAllResults] = useState<AniListMedia[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Reset page when filters change
  useEffect(() => { setPage(1); setAllResults([]); }, [debouncedQuery, selectedGenres, sortBy, status, format]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', debouncedQuery, selectedGenres, sortBy, status, format, filterParam, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set('q', debouncedQuery);
      params.set('sort', sortBy);
      params.set('limit', '24');
      params.set('page', String(page));
      if (selectedGenres.length) params.set('genres', selectedGenres.join(','));
      if (status) params.set('status', status);
      if (format) params.set('format', format);
      if (filterParam === 'seasonal') params.set('type', 'seasonal');
      const res = await fetch(`/api/anime?${params}`);
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
  });

  // Accumulate pages
  useEffect(() => {
    if (data?.media) {
      if (page === 1) {
        setAllResults(data.media);
        // Animate new results
        if (resultsRef.current) {
          const cards = resultsRef.current.querySelectorAll('.anime-card');
          gsap.fromTo(cards, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.03, ease: 'power2.out' });
        }
      } else {
        setAllResults(prev => {
          const ids = new Set(prev.map(a => a.id));
          const newItems = data.media.filter((a: AniListMedia) => !ids.has(a.id));
          return [...prev, ...newItems];
        });
      }
    }
  }, [data, page]);

  // Header animation on mount
  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(headerRef.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    }
  }, []);

  const toggleGenre = (g: string) => {
    setSelectedGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  const clearFilters = () => {
    setSelectedGenres([]); setSortBy('TRENDING_DESC'); setStatus(''); setFormat(''); setQuery('');
  };

  const hasFilters = selectedGenres.length > 0 || status || format || query;
  const hasMore = data?.pageInfo?.hasNextPage;
  const title = debouncedQuery
    ? `Results for "${debouncedQuery}"`
    : filterParam === 'seasonal' ? 'This Season' : 'Browse Anime';

  return (
    <div className="min-h-screen pt-20 pb-16">
      {/* Header */}
      <div ref={headerRef} className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <h1 className="font-display text-3xl sm:text-4xl text-kuro-text mb-6 tracking-wide">
          {title}
        </h1>

        {/* Search + Controls bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-kuro-dim pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search anime titles, genres, studios…"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-kuro-surface border border-kuro-border text-kuro-text placeholder:text-kuro-dim text-sm outline-none focus:border-kuro-primary transition-colors"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-kuro-dim hover:text-white">
                <X size={16} />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative sm:w-auto">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-3 rounded-xl bg-kuro-surface border border-kuro-border text-kuro-text text-sm outline-none focus:border-kuro-primary cursor-pointer transition-colors sm:min-w-[160px]"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-kuro-dim pointer-events-none" />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all',
              showFilters || hasFilters
                ? 'bg-kuro-primary/10 border-kuro-primary text-kuro-primary'
                : 'bg-kuro-surface border-kuro-border text-kuro-muted hover:text-white'
            )}
          >
            <SlidersHorizontal size={16} />
            Filters
            {hasFilters && <span className="w-5 h-5 rounded-full bg-kuro-primary text-white text-xs flex items-center justify-center">{selectedGenres.length + (status ? 1 : 0) + (format ? 1 : 0)}</span>}
          </button>

          {/* View mode */}
          <div className="hidden sm:flex items-center gap-1 bg-kuro-surface border border-kuro-border rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn('p-2 rounded-lg transition-colors', viewMode === 'grid' ? 'bg-kuro-primary text-white' : 'text-kuro-muted hover:text-white')}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('p-2 rounded-lg transition-colors', viewMode === 'list' ? 'bg-kuro-primary text-white' : 'text-kuro-muted hover:text-white')}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-4 p-4 rounded-xl bg-kuro-surface border border-kuro-border space-y-4">
            {/* Genres */}
            <div>
              <p className="text-xs font-semibold text-kuro-muted uppercase tracking-wider mb-2">Genres</p>
              <div className="flex flex-wrap gap-2">
                {GENRES.map(g => (
                  <button
                    key={g}
                    onClick={() => toggleGenre(g)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                      selectedGenres.includes(g)
                        ? 'bg-kuro-primary text-white shadow-red-glow'
                        : 'bg-kuro-surface2 text-kuro-muted hover:text-white hover:bg-kuro-surface3'
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              {/* Status */}
              <div>
                <p className="text-xs font-semibold text-kuro-muted uppercase tracking-wider mb-2">Status</p>
                <div className="flex gap-2 flex-wrap">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => setStatus(status === s ? '' : s)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                        status === s ? 'bg-kuro-primary text-white' : 'bg-kuro-surface2 text-kuro-muted hover:text-white'
                      )}
                    >
                      {s.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format */}
              <div>
                <p className="text-xs font-semibold text-kuro-muted uppercase tracking-wider mb-2">Format</p>
                <div className="flex gap-2 flex-wrap">
                  {FORMAT_OPTIONS.map(f => (
                    <button
                      key={f}
                      onClick={() => setFormat(format === f ? '' : f)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                        format === f ? 'bg-kuro-primary text-white' : 'bg-kuro-surface2 text-kuro-muted hover:text-white'
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-kuro-dim hover:text-kuro-primary transition-colors">
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Count */}
        {data?.pageInfo?.total > 0 && (
          <p className="text-kuro-dim text-sm mb-4">
            {data.pageInfo.total.toLocaleString()} results{debouncedQuery && ` for "${debouncedQuery}"`}
          </p>
        )}

        {/* Grid */}
        <div
          ref={resultsRef}
          className={cn(
            'grid gap-4',
            viewMode === 'grid'
              ? 'grid-cols-2 gap-x-3 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7'
              : 'grid-cols-1'
          )}
        >
          {isLoading && page === 1
            ? Array.from({ length: 20 }).map((_, i) => <AnimeCardSkeleton key={i} />)
            : allResults.map(item => <AnimeCard key={item.id} anime={item} />)
          }
        </div>

        {/* Empty state */}
        {!isLoading && allResults.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-kuro-text mb-2">No results found</h3>
            <p className="text-kuro-muted text-sm">Try different keywords or remove some filters</p>
          </div>
        )}

        {/* Load more */}
        {hasMore && !isLoading && (
          <div className="flex justify-center mt-10">
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={isFetching}
              className="px-8 py-3 rounded-xl bg-kuro-surface border border-kuro-border text-kuro-text font-medium hover:border-kuro-primary hover:text-kuro-primary transition-all disabled:opacity-50"
            >
              {isFetching ? 'Loading…' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-20 px-8 flex items-center justify-center"><div className="text-kuro-muted">Loading…</div></div>}>
      <SearchPageInner />
    </Suspense>
  );
}
