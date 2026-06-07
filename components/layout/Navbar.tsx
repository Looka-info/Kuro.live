'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bookmark, Calendar, Flame, Grid2X2, Home, LogIn, Menu, PlayCircle, Search, Sparkles, Star, UserCircle, X } from 'lucide-react';
import gsap from 'gsap';
import anime from 'animejs';
import { cn } from '@/lib/utils';
import { useAuthStore, useWatchlistStore } from '@/store';

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/trending', label: 'Trending', icon: Flame },
  { href: '/new-season', label: 'New Season', icon: Calendar },
  { href: '/top-anime', label: 'Top Anime', icon: Star },
  { href: '/categories', label: 'Categories', icon: Grid2X2 },
];

const quickGenres = ['Action', 'Romance', 'Fantasy', 'Comedy'];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const brandRef = useRef<HTMLAnchorElement>(null);
  const watchlistCount = useWatchlistStore(state => state.items.length);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navRef.current) return;
    gsap.fromTo(
      navRef.current,
      { y: -80, opacity: 0, filter: 'blur(12px)' },
      { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9, ease: 'expo.out', delay: 0.15 },
    );
  }, []);

  const handleBrandHover = () => {
    if (!brandRef.current) return;
    anime({
      targets: brandRef.current.querySelectorAll('.brand-glyph'),
      rotate: ['0deg', '8deg', '-6deg', '0deg'],
      scale: [1, 1.08, 1],
      duration: 620,
      easing: 'easeOutElastic(1, .6)',
    });
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setSearchQuery('');
    setMobileOpen(false);
  };

  return (
    <nav
      ref={navRef}
      className={cn(
        'fixed left-0 right-0 top-0 z-50 px-3 py-3 transition-all duration-500',
        scrolled ? 'translate-y-0' : 'translate-y-0',
      )}
    >
      <div
        className={cn(
          'anime-nav mx-auto flex h-16 max-w-screen-2xl items-center justify-between rounded-[1.6rem] px-2.5 sm:px-4',
          scrolled ? 'anime-nav--scrolled shadow-card' : 'shadow-red-ring',
        )}
      >
        <Link
          ref={brandRef}
          href="/"
          onMouseEnter={handleBrandHover}
          className="group flex min-w-0 items-center gap-2 rounded-2xl pr-2 sm:gap-3 sm:pr-3"
        >
          <span className="brand-glyph relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-kuro-primary/35 bg-black shadow-red-ring">
            <Image
              src="/logo.png"
              alt=""
              fill
              priority
              sizes="44px"
              className="object-cover"
            />
          </span>
          <span className="min-w-0">
            <span className="micro-label hidden leading-none text-kuro-primary sm:block">anime cinema</span>
            <span className="block truncate font-display text-2xl leading-none tracking-tight text-white">
              KURU<span className="text-kuro-primary">.LIVE</span>
            </span>
          </span>
        </Link>

        <div className="hidden items-center rounded-2xl border border-white/10 bg-black/35 p-1 lg:flex">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href.split('?')[0]));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-black uppercase tracking-[0.1em] transition-all duration-300',
                  active
                    ? 'bg-kuro-primary text-white shadow-red-glow'
                    : 'text-kuro-muted hover:bg-white/8 hover:text-white',
                )}
              >
                <Icon size={14} />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="hidden md:block">
            <label className="group flex h-11 w-48 items-center gap-2 rounded-2xl border border-kuro-primary/20 bg-black/55 px-4 transition-all duration-300 focus-within:w-72 focus-within:border-kuro-primary/70 focus-within:bg-black/85">
              <Search size={15} className="text-kuro-primary" />
              <input
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="Search anime..."
                className="w-full bg-transparent text-sm text-white placeholder:text-kuro-dim outline-none"
              />
            </label>
          </form>

          <Link
            href="/new-season"
            className="hidden h-11 items-center gap-2 rounded-2xl border border-kuro-primary/30 bg-kuro-primary/12 px-4 text-xs font-black uppercase tracking-[0.13em] text-kuro-primary transition-all hover:bg-kuro-primary hover:text-white xl:inline-flex"
          >
            <PlayCircle size={16} />
            Episodes
          </Link>

          <Link
            href="/my-list"
            className="relative hidden h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-3 text-xs font-black uppercase tracking-[0.12em] text-kuro-muted transition-all hover:border-kuro-primary/50 hover:text-white sm:inline-flex"
            aria-label="My list"
          >
            <Bookmark size={18} />
            <span className="hidden xl:inline">Watchlist</span>
            {watchlistCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-kuro-primary px-1 text-[10px] font-bold text-white">
                {watchlistCount > 9 ? '9+' : watchlistCount}
              </span>
            )}
          </Link>

          {user ? (
            <Link
              href="/profile"
              className="hidden h-11 items-center gap-2 rounded-2xl border border-kuro-primary/35 bg-kuro-primary/12 px-3 text-xs font-black uppercase tracking-[0.12em] text-white transition-all hover:bg-kuro-primary sm:inline-flex"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full text-[11px] text-white" style={{ background: user.avatarColor }}>
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden xl:inline">Profile</span>
            </Link>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-3 text-xs font-black uppercase tracking-[0.12em] text-kuro-muted hover:text-white"
              >
                <LogIn size={16} />
                Login
              </Link>
              <Link
                href="/signup"
                className="neo-button hidden h-11 items-center rounded-2xl bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-black xl:inline-flex"
              >
                Sign up
              </Link>
            </div>
          )}

          <button
            onClick={() => setMobileOpen(value => !value)}
            className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.045] text-kuro-muted md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="anime-mobile-menu mx-1 mt-2 max-h-[calc(100svh-5.5rem)] overflow-y-auto rounded-[1.6rem] border border-white/10 bg-black/95 p-4 shadow-card backdrop-blur-xl md:hidden">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="micro-label text-kuro-primary">now browsing</p>
              <p className="font-display text-3xl leading-none text-white">Anime Menu</p>
            </div>
            <Link href="/my-list" className="relative grid h-11 w-11 place-items-center rounded-2xl bg-kuro-primary text-white">
              <Bookmark size={18} />
              {watchlistCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[10px] font-black text-black">
                  {watchlistCount > 9 ? '9+' : watchlistCount}
                </span>
              )}
            </Link>
          </div>

          <form onSubmit={handleSearch} className="mb-3 flex items-center gap-2 rounded-2xl border border-kuro-primary/25 bg-white/[0.04] px-4 py-3">
            <Search size={15} className="text-kuro-primary" />
            <input
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="Search anime..."
              className="flex-1 bg-transparent text-sm text-white outline-none"
            />
          </form>
          <div className="grid gap-2">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.035] px-4 py-3 text-sm font-bold text-kuro-muted hover:bg-white/8 hover:text-white"
              >
                <Icon size={17} />
                {label}
              </Link>
            ))}

            <div className="mt-3 grid grid-cols-2 gap-2">
              {quickGenres.map(genre => (
                <Link
                  key={genre}
                  href={`/genre/${genre.toLowerCase()}`}
                  className="rounded-2xl border border-kuro-primary/20 bg-kuro-primary/10 px-4 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-kuro-primary"
                >
                  {genre}
                </Link>
              ))}
            </div>

            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-kuro-primary/20 bg-kuro-primary/10 px-4 py-3 text-xs text-kuro-primary">
              <Sparkles size={15} /> New episodes and top picks ready
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {user ? (
                <Link
                  href="/profile"
                  className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-black"
                >
                  <UserCircle size={16} />
                  Profile
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white"
                  >
                    <LogIn size={16} />
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="neo-button flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-black"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
