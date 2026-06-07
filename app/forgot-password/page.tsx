'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim().includes('@')) {
      toast.error('Use a valid email address.');
      return;
    }
    toast.success('Reset instructions staged for this device.');
  };

  return (
    <main className="auth-shell min-h-screen px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <Card className="mx-auto max-w-xl p-0">
        <CardContent className="p-6 sm:p-8">
        <Link href="/" className="mb-8 inline-flex items-center gap-3">
          <Image src="/logo.png" alt="Kuru.live" width={48} height={48} className="rounded-2xl border border-kuro-primary/35 shadow-red-ring" />
          <span className="font-display text-3xl text-white">KURU<span className="text-kuro-primary">.LIVE</span></span>
        </Link>

        <CardHeader className="p-0">
          <p className="micro-label text-kuro-primary">account recovery</p>
          <CardTitle className="mt-2 text-6xl">Reset access</CardTitle>
          <CardDescription>
            Enter your email and Kuru will prepare a reset flow for this local session.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <label className="relative block">
            <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-kuro-muted" />
            <Input value={email} onChange={event => setEmail(event.target.value)} placeholder="Email address" type="email" autoComplete="email" className="pl-11" />
          </label>

          <Button className="w-full" size="lg">
            Send reset link
            <Send size={16} />
          </Button>
        </form>

        <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'mt-6' })}>
          <ArrowLeft size={15} />
          Back to login
        </Link>
        </CardContent>
      </Card>
    </main>
  );
}
