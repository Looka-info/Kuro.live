'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, LockKeyhole, Mail, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface AuthPanelProps {
  mode: 'login' | 'signup';
}

const benefits = [
  'Sync your watchlist on this device',
  'Resume episodes from your personal shelf',
  'Keep anime nights tidy and fast',
];

export function AuthPanel({ mode }: AuthPanelProps) {
  const isSignup = mode === 'signup';
  const router = useRouter();
  const signup = useAuthStore(state => state.signup);
  const login = useAuthStore(state => state.login);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const headline = isSignup ? 'Claim your seat in the night.' : 'Welcome back to the queue.';
  const submitLabel = isSignup ? 'Create account' : 'Sign in';
  const alternate = useMemo(
    () => isSignup
      ? { href: '/login', copy: 'Already have an account?', label: 'Sign in' }
      : { href: '/signup', copy: 'New to Kuru?', label: 'Create account' },
    [isSignup],
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      toast.error('Use a valid email address.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password needs at least 6 characters.');
      return;
    }

    if (isSignup) {
      if (!cleanName) {
        toast.error('Add a display name.');
        return;
      }
      signup({ name: cleanName, email: cleanEmail });
      toast.success('Account ready.');
    } else {
      login(cleanEmail);
      toast.success('Signed in.');
    }

    router.push('/profile');
  };

  return (
    <main className="auth-shell min-h-screen px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
        <Card data-reveal className="relative overflow-hidden p-0">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-kuro-primary/25 blur-3xl" />
          <CardContent className="relative p-6 sm:p-9">
            <Link href="/" className="mb-9 inline-flex items-center gap-3">
              <Image src="/logo.png" alt="Kuru.live" width={52} height={52} className="rounded-2xl border border-kuro-primary/35 shadow-red-ring" />
              <div>
                <Badge variant="outline" className="mb-1 border-kuro-primary/30 text-kuro-primary">kuru access</Badge>
                <p className="font-display text-3xl leading-none text-white">KURU.LIVE</p>
              </div>
            </Link>

            <Badge className="mb-4">{isSignup ? 'new viewer' : 'returning viewer'}</Badge>
            <h1 className="max-w-2xl font-display text-6xl leading-[0.86] text-white sm:text-8xl">
              {headline}
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-kuro-muted sm:text-base">
              Build your list, keep progress close, and move from discovery to episode one without losing the thread.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {benefits.map((benefit, index) => (
                <div key={benefit} className="rounded-3xl border border-white/10 bg-black/30 p-4">
                  <Badge variant="muted" className="border-kuro-primary/20 text-kuro-primary">0{index + 1}</Badge>
                  <p className="mt-3 text-sm font-bold text-white">{benefit}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="p-5 pb-4 sm:p-7 sm:pb-5">
            <Badge className="w-fit">{submitLabel}</Badge>
            <CardTitle className="mt-2 text-5xl">
              {isSignup ? 'Start watching' : 'Open your list'}
            </CardTitle>
            <CardDescription>
              {isSignup ? 'Create your local Kuru profile.' : 'Continue from your local Kuru profile.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 pt-0 sm:p-7 sm:pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup ? (
              <label className="relative block">
                <UserRound size={18} className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-kuro-muted" />
                <Input value={name} onChange={event => setName(event.target.value)} placeholder="Display name" autoComplete="name" className="pl-11" />
              </label>
            ) : null}

            <label className="relative block">
              <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-kuro-muted" />
              <Input value={email} onChange={event => setEmail(event.target.value)} placeholder="Email address" type="email" autoComplete="email" className="pl-11" />
            </label>

            <label className="relative block">
              <LockKeyhole size={18} className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-kuro-muted" />
              <Input value={password} onChange={event => setPassword(event.target.value)} placeholder="Password" type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} className="pl-11 pr-11" />
              <Eye size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-kuro-dim" />
            </label>

            {!isSignup ? (
              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-xs font-bold uppercase tracking-[0.14em] text-kuro-muted hover:text-kuro-primary">
                  Forgot password?
                </Link>
              </div>
            ) : null}

            <Button className="w-full" size="lg">
              {submitLabel}
              <ArrowRight size={17} />
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-kuro-muted">
            {alternate.copy}{' '}
            <Link href={alternate.href} className={buttonVariants({ variant: 'link', className: 'font-bold normal-case tracking-normal' })}>
              {alternate.label}
            </Link>
          </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
