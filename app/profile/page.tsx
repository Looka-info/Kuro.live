'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bookmark, CalendarClock, LogOut, PlayCircle, Trophy, UserRound } from 'lucide-react';
import { useAuthStore, useWatchlistStore } from '@/store';
import { getViewerProgress, timeSince, type ViewerProgress } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const items = useWatchlistStore(state => state.items);
  const watching = items.filter(item => item.status === 'watching').length;
  const completed = items.filter(item => item.status === 'completed').length;
  const [viewerProgress, setViewerProgress] = useState<ViewerProgress | null>(null);

  useEffect(() => {
    setViewerProgress(getViewerProgress());
  }, []);

  if (!user) {
    return (
      <main className="min-h-screen px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-2xl p-8 text-center">
          <UserRound size={42} className="mx-auto mb-5 text-kuro-primary" />
          <h1 className="font-display text-6xl leading-none text-white">Sign in first</h1>
          <p className="mt-4 text-sm leading-7 text-kuro-muted">
            Your profile keeps your list and episode progress close.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/login" className={buttonVariants({ size: 'sm' })}>
              Login
            </Link>
            <Link href="/signup" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Sign up
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <section className="profile-hero mx-auto max-w-screen-2xl overflow-hidden rounded-[2.5rem] border border-white/10 p-6 shadow-card sm:p-9">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div
              className="grid h-24 w-24 shrink-0 place-items-center rounded-[2rem] border border-white/15 text-4xl font-black text-white shadow-red-ring"
              style={{ background: user.avatarColor }}
            >
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="micro-label text-kuro-primary">viewer profile</p>
              <h1 className="mt-2 font-display text-6xl leading-none text-white sm:text-8xl">{user.name}</h1>
              <p className="mt-2 text-sm text-kuro-muted">{user.email}</p>
            </div>
          </div>

          <Button
            onClick={() => {
              logout();
              router.push('/');
            }}
            variant="outline"
            size="sm"
          >
            <LogOut size={16} />
            Logout
          </Button>
        </div>
      </section>

      <section className="mx-auto mt-8 grid max-w-screen-2xl gap-4 md:grid-cols-4">
        {[
          { label: 'Saved titles', value: items.length, icon: Bookmark },
          { label: 'Watching', value: watching, icon: PlayCircle },
          { label: 'Completed', value: completed, icon: CalendarClock },
          { label: `${viewerProgress?.watchedCount || 0} watched`, value: `Lv ${viewerProgress?.level || 1}`, icon: Trophy },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-6">
            <Icon size={22} className="mb-5 text-kuro-primary" />
            <p className="font-display text-5xl leading-none text-white">{value}</p>
            <CardDescription className="mt-2 leading-none">{label}</CardDescription>
            {label.includes('watched') && (
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-white shadow-red-glow"
                  style={{ width: `${viewerProgress?.progressPercent || 0}%` }}
                />
              </div>
            )}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mx-auto mt-8 max-w-screen-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <Badge className="mb-3">latest saves</Badge>
            <h2 className="font-display text-4xl leading-none text-white">Your shelf</h2>
          </div>
          <Link href="/my-list" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Full list
          </Link>
        </div>

        {items.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {items.slice(0, 8).map(item => (
              <Link key={item.id} href={`/anime/${item.id}`}>
                <Card className="flex gap-3 rounded-3xl p-3 transition-colors hover:border-kuro-primary/40">
                <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-2xl bg-kuro-surface">
                  <Image src={item.image} alt={item.title} fill className="object-cover" unoptimized />
                </div>
                <div className="min-w-0 py-1">
                  <p className="line-clamp-2 text-sm font-bold text-white">{item.title}</p>
                  <p className="mt-2 text-xs text-kuro-muted">Episode {item.progress || 0}</p>
                  <p className="mt-1 text-[11px] text-kuro-dim">{timeSince(item.addedAt)}</p>
                </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <CardHeader className="p-0">
              <CardTitle>Your shelf is empty</CardTitle>
            </CardHeader>
            <Link href="/browse" className={buttonVariants({ variant: 'link', className: 'mt-4 normal-case tracking-normal' })}>
              Browse anime
            </Link>
          </Card>
        )}
      </section>
    </main>
  );
}
