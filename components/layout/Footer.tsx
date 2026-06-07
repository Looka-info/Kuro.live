import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export function Footer() {
  return (
    <footer data-reveal className="relative mt-28 overflow-hidden border-t border-white/10 bg-black/35">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.10),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />
      <div className="relative mx-auto max-w-screen-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <Link href="/" className="mb-5 inline-flex items-center gap-3" aria-label="Kuru.live home">
              <Image
                src="/logo.png"
                alt="Kuru.live"
                width={56}
                height={56}
                className="h-14 w-14 rounded-full border border-white/10 object-cover shadow-red-ring"
              />
              <div>
                <div className="micro-label">kuru.live archive</div>
                <div className="font-display text-2xl leading-none text-white">
                  KURU<span className="text-kuro-primary">.LIVE</span>
                </div>
              </div>
            </Link>
            <h2 className="font-display text-7xl leading-none text-white sm:text-9xl">
              Watch the night breathe.
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-kuro-muted">
              A cinematic place to discover favorites, remember every episode, and settle in for the night.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/search" className={buttonVariants({ size: 'sm', className: 'rounded-full' })}>
                Enter catalog <ArrowUpRight size={15} />
              </Link>
              <Link href="/about" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'rounded-full' })}>
                Our story
              </Link>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3 lg:grid-cols-2">
            {[
              { title: 'Browse', links: [['Trending', '/search?sort=trending'], ['Seasonal', '/search?filter=seasonal'], ['Top Rated', '/search?sort=score']] },
              { title: 'Genres', links: [['Action', '/search?genres=Action'], ['Romance', '/search?genres=Romance'], ['Fantasy', '/search?genres=Fantasy']] },
              { title: 'Kuru', links: [['My List', '/my-list'], ['Profile', '/profile'], ['Login', '/login'], ['Sign up', '/signup'], ['Reset access', '/forgot-password']] },
              { title: 'Legal', links: [['Privacy', '/privacy'], ['Terms', '/terms'], ['Home', '/']] },
            ].map(section => (
              <div key={section.title}>
                <h3 className="micro-label mb-4 text-white">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className="text-sm text-kuro-muted transition-colors hover:text-white">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-kuro-dim sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Kuru.live. Designed for cinematic browsing.</p>
          <p>Made for quiet nights and loud openings.</p>
        </div>
      </div>
    </footer>
  );
}
