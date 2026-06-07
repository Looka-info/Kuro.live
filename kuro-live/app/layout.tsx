import type { Metadata, Viewport } from 'next';
import { Bebas_Neue, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from 'react-hot-toast';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bebas',
  display: 'swap',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://kuru.live'),
  title: { default: 'Kuru.live - Anime arrives.', template: '%s | Kuru.live' },
  description: 'A modern anime streaming platform for discovery, watch progress, comments, and cinematic HLS playback.',
  keywords: ['anime', 'stream', 'watch anime', 'kuru', 'kuru.live'],
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'Kuru.live',
    title: 'Kuru.live - Anime arrives.',
    description: 'Discover, save, and watch anime on Kuru.live.',
    images: [{ url: '/logo.png', width: 1254, height: 1254, alt: 'Kuru.live logo' }],
  },
  twitter: { card: 'summary', images: ['/logo.png'] },
};

export const viewport: Viewport = {
  themeColor: '#111111',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${bebasNeue.variable} ${jetBrainsMono.variable}`}>
      <body className="bg-kuro-bg text-kuro-text font-sans antialiased min-h-screen flex flex-col selection:bg-kuro-primary/30">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1A1A1A',
                color: '#F5F5F5',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: '8px',
              },
              success: { iconTheme: { primary: '#f5f5f7', secondary: '#111111' } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
