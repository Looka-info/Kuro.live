'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WatchlistEntry } from '@/lib/utils';

export interface KuruUser {
  name: string;
  email: string;
  avatarColor: string;
  joinedAt: string;
}

interface AuthStore {
  user: KuruUser | null;
  signup: (user: Pick<KuruUser, 'name' | 'email'>) => void;
  login: (email: string) => void;
  logout: () => void;
}

function avatarColor(seed: string) {
  const palette = ['#E8001D', '#f97316', '#eab308', '#22c55e', '#38bdf8', '#a855f7'];
  const index = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length;
  return palette[index];
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      signup: ({ name, email }) => set({
        user: {
          name,
          email,
          avatarColor: avatarColor(email),
          joinedAt: new Date().toISOString(),
        },
      }),
      login: (email) => set(state => ({
        user: state.user?.email === email
          ? state.user
          : {
              name: email.split('@')[0] || 'Kuru Viewer',
              email,
              avatarColor: avatarColor(email),
              joinedAt: new Date().toISOString(),
            },
      })),
      logout: () => set({ user: null }),
    }),
    { name: 'kuro-auth', version: 1 },
  ),
);

interface WatchlistStore {
  items: WatchlistEntry[];
  add: (entry: Omit<WatchlistEntry, 'addedAt'>) => void;
  remove: (id: number | string) => void;
  updateProgress: (id: number | string, episode: number) => void;
  updateScore: (id: number | string, score: number) => void;
  updateStatus: (id: number | string, status: WatchlistEntry['status']) => void;
  getEntry: (id: number | string) => WatchlistEntry | null;
  isInList: (id: number | string) => boolean;
}

export const useWatchlistStore = create<WatchlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (entry) => {
        set(state => {
          const existing = state.items.findIndex(e => e.id === entry.id);
          const newEntry: WatchlistEntry = { ...entry, addedAt: new Date().toISOString() };
          if (existing >= 0) {
            const items = [...state.items];
            items[existing] = newEntry;
            return { items };
          }
          return { items: [newEntry, ...state.items] };
        });
      },
      remove: (id) => set(state => ({ items: state.items.filter(e => e.id !== id) })),
      updateProgress: (id, episode) => {
        set(state => ({
          items: state.items.map(e => e.id === id ? { ...e, progress: episode } : e),
        }));
      },
      updateScore: (id, score) => {
        set(state => ({
          items: state.items.map(e => e.id === id ? { ...e, score } : e),
        }));
      },
      updateStatus: (id, status) => {
        set(state => ({
          items: state.items.map(e => e.id === id ? { ...e, status } : e),
        }));
      },
      getEntry: (id) => get().items.find(e => e.id === id) || null,
      isInList: (id) => get().items.some(e => e.id === id),
    }),
    {
      name: 'kuro-watchlist',
      version: 1,
    }
  )
);

// ── Player Store ──────────────────────────────────────────
interface PlayerStore {
  volume: number;
  muted: boolean;
  quality: string;
  speed: number;
  subtitlesEnabled: boolean;
  theatreMode: boolean;
  setVolume: (v: number) => void;
  setMuted: (m: boolean) => void;
  setQuality: (q: string) => void;
  setSpeed: (s: number) => void;
  setSubtitles: (s: boolean) => void;
  setTheatre: (t: boolean) => void;
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set) => ({
      volume: 1,
      muted: false,
      quality: 'auto',
      speed: 1,
      subtitlesEnabled: true,
      theatreMode: false,
      setVolume: (volume) => set({ volume }),
      setMuted: (muted) => set({ muted }),
      setQuality: (quality) => set({ quality }),
      setSpeed: (speed) => set({ speed }),
      setSubtitles: (subtitlesEnabled) => set({ subtitlesEnabled }),
      setTheatre: (theatreMode) => set({ theatreMode }),
    }),
    { name: 'kuro-player', version: 1 }
  )
);

// ── UI Store ──────────────────────────────────────────────
interface UIStore {
  searchOpen: boolean;
  loginModalOpen: boolean;
  sidebarOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  setLoginModal: (v: boolean) => void;
  setSidebar: (v: boolean) => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  searchOpen: false,
  loginModalOpen: false,
  sidebarOpen: false,
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setLoginModal: (loginModalOpen) => set({ loginModalOpen }),
  setSidebar: (sidebarOpen) => set({ sidebarOpen }),
}));
