import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

const variants: Record<ButtonVariant, string> = {
  default: 'bg-white text-black shadow-red-glow hover:bg-white/90',
  secondary: 'bg-kuro-primary text-white shadow-red-glow hover:bg-kuro-primary-hover',
  outline: 'border border-white/10 bg-white/[0.04] text-white hover:border-white/20 hover:bg-white/[0.07]',
  ghost: 'text-kuro-muted hover:bg-white/[0.06] hover:text-white',
  link: 'h-auto p-0 text-kuro-muted underline-offset-4 hover:text-white hover:underline',
  destructive: 'bg-zinc-200 text-black hover:bg-white',
};

const sizes: Record<ButtonSize, string> = {
  default: 'h-11 px-5 py-2.5',
  sm: 'h-9 rounded-xl px-3 text-xs',
  lg: 'h-13 rounded-2xl px-7 py-4',
  icon: 'h-11 w-11',
};

export function buttonVariants({
  variant = 'default',
  size = 'default',
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    'neo-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-black uppercase tracking-[0.14em] transition-all disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    className,
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={buttonVariants({ variant, size, className })} {...props} />
  ),
);

Button.displayName = 'Button';
