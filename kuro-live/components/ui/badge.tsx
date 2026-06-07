import * as React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'muted';

const variants: Record<BadgeVariant, string> = {
  default: 'border-transparent bg-white text-black shadow-red-glow',
  secondary: 'border-transparent bg-kuro-primary text-white',
  outline: 'border-white/10 bg-white/[0.04] text-white',
  muted: 'border-white/8 bg-white/[0.035] text-kuro-muted',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
