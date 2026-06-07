import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        kuro: {
          bg: '#0A0A0A',
          surface: '#111111',
          surface2: '#1A1A1A',
          surface3: '#222222',
          border: '#2a2a2a',
          primary: '#71717a',
          'primary-hover': '#a1a1aa',
          'primary-dark': '#52525b',
          accent: '#f5f5f7',
          'accent-2': '#d4d4d8',
          text: '#f5f5f5',
          muted: '#a1a1aa',
          dim: '#71717a',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-bebas)', 'sans-serif'],
      },
      backgroundImage: {
        'red-glow': 'radial-gradient(ellipse at center, rgba(255,255,255,0.14) 0%, transparent 70%)',
        'hero-gradient': 'linear-gradient(to right, rgba(10,10,10,0.98) 32%, rgba(10,10,10,0.64) 60%, transparent 100%)',
        'card-gradient': 'linear-gradient(to top, rgba(10,10,10,0.98) 0%, rgba(10,10,10,0.4) 55%, transparent 100%)',
        'surface-gradient': 'linear-gradient(135deg, #111111 0%, #1A1A1A 100%)',
        'kuru-slice': 'linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.16) 45%, transparent 62%)',
      },
      boxShadow: {
        'red-glow': '0 0 20px rgba(255,255,255,0.14)',
        'red-glow-lg': '0 0 44px rgba(255,255,255,0.10)',
        'red-ring': '0 0 0 1px rgba(255,255,255,0.16), 0 20px 60px rgba(0,0,0,0.26)',
        'card': '0 4px 20px rgba(0,0,0,0.6)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.8)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'slide-in-left': 'slideInLeft 0.4s ease forwards',
        'pulse-red': 'pulseRed 2s infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInLeft: { from: { opacity: '0', transform: 'translateX(-20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        pulseRed: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255,255,255,0.14)' },
          '50%': { boxShadow: '0 0 40px rgba(255,255,255,0.26)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      screens: {
        xs: '480px',
      },
    },
  },
  plugins: [],
};

export default config;
