// Utility helpers shared across the app

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Format score (AniList uses 0-100, show as X.X) ──────
export function formatScore(score?: number): string {
  if (!score) return 'N/A';
  return (score / 10).toFixed(1);
}

// ── Format episode count ──────────────────────────────────
export function formatEpisodes(count?: number): string {
  if (!count) return '? eps';
  return `${count} ep${count !== 1 ? 's' : ''}`;
}

// ── Format duration ───────────────────────────────────────
export function formatDuration(minutes?: number): string {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ── Get best image URL ────────────────────────────────────
export function getBestImage(coverImage?: { extraLarge?: string; large?: string; medium?: string } | null): string {
  return coverImage?.extraLarge || coverImage?.large || coverImage?.medium || '/placeholder-anime.jpg';
}

// ── Get anime title ───────────────────────────────────────
export function getTitle(title?: { english?: string; romaji?: string; native?: string; userPreferred?: string } | null): string {
  return title?.english || title?.romaji || title?.userPreferred || title?.native || 'Unknown';
}

// ── Strip HTML from description ───────────────────────────
export function stripHtml(html?: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, ' ').trim();
}

// ── Truncate text ─────────────────────────────────────────
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '…';
}

// ── Status badge color ────────────────────────────────────
export function statusColor(status?: string): string {
  switch (status?.toUpperCase()) {
    case 'RELEASING': case 'AIRING': return 'text-green-400 bg-green-400/10';
    case 'FINISHED': case 'FINISHED_AIRING': return 'text-kuro-muted bg-white/5';
    case 'NOT_YET_RELEASED': case 'UPCOMING': return 'text-yellow-400 bg-yellow-400/10';
    case 'CANCELLED': return 'text-red-400 bg-red-400/10';
    default: return 'text-kuro-muted bg-white/5';
  }
}

// ── Format status label ───────────────────────────────────
export function formatStatus(status?: string): string {
  switch (status?.toUpperCase()) {
    case 'RELEASING': return 'Airing';
    case 'FINISHED': return 'Finished';
    case 'NOT_YET_RELEASED': return 'Upcoming';
    case 'CANCELLED': return 'Cancelled';
    case 'HIATUS': return 'On Hiatus';
    default: return status || 'Unknown';
  }
}

// ── Format season/year ────────────────────────────────────
export function formatSeason(season?: string, year?: number): string {
  if (!season && !year) return '';
  const s = season ? season.charAt(0) + season.slice(1).toLowerCase() : '';
  return [s, year].filter(Boolean).join(' ');
}

// ── Score ring color ──────────────────────────────────────
export function scoreColor(score?: number): string {
  if (!score) return '#71717a';
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

// ── Format number with K/M ────────────────────────────────
export function formatNum(n?: number): string {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// ── Time since ────────────────────────────────────────────
export function timeSince(dateString?: string): string {
  if (!dateString) return '';
  const diff = Date.now() - new Date(dateString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString();
}

// ── Watchlist LocalStorage helpers (demo mode) ────────────
export interface WatchlistEntry {
  id: number | string;
  title: string;
  image: string;
  status: 'watching' | 'completed' | 'plan_to_watch' | 'dropped' | 'on_hold';
  progress: number;
  totalEpisodes?: number;
  score?: number;
  addedAt: string;
}

export function getWatchlist(): WatchlistEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('kuro_watchlist') || '[]');
  } catch { return []; }
}

export function addToWatchlist(entry: Omit<WatchlistEntry, 'addedAt'>): void {
  const list = getWatchlist();
  const existing = list.findIndex(e => e.id === entry.id);
  const newEntry = { ...entry, addedAt: new Date().toISOString() };
  if (existing >= 0) list[existing] = newEntry;
  else list.unshift(newEntry);
  localStorage.setItem('kuro_watchlist', JSON.stringify(list));
}

export function removeFromWatchlist(id: number | string): void {
  const list = getWatchlist().filter(e => e.id !== id);
  localStorage.setItem('kuro_watchlist', JSON.stringify(list));
}

export function getWatchlistEntry(id: number | string): WatchlistEntry | null {
  return getWatchlist().find(e => e.id === id) || null;
}

export function updateProgress(id: number | string, episode: number): void {
  const list = getWatchlist();
  const entry = list.find(e => e.id === id);
  if (entry) {
    entry.progress = episode;
    localStorage.setItem('kuro_watchlist', JSON.stringify(list));
  }
}

// ── Watch History ─────────────────────────────────────────
export interface WatchHistoryEntry {
  animeId: number | string;
  episode: number;
  progress: number; // seconds
  duration: number; // seconds
  timestamp: string;
  title: string;
  image: string;
}

export function getWatchHistory(): WatchHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('kuro_history') || '[]'); }
  catch { return []; }
}

export function saveWatchProgress(entry: WatchHistoryEntry): void {
  const history = getWatchHistory();
  const idx = history.findIndex(h => h.animeId === entry.animeId && h.episode === entry.episode);
  if (idx >= 0) history[idx] = entry;
  else history.unshift(entry);
  localStorage.setItem('kuro_history', JSON.stringify(history.slice(0, 50)));
}

export function updateWatchHistory(
  entry: Omit<WatchHistoryEntry, 'timestamp'> & { timestamp?: string | number }
): void {
  saveWatchProgress({
    ...entry,
    timestamp: entry.timestamp ? String(entry.timestamp) : new Date().toISOString(),
  });
}

// Community and viewer progress helpers
export type AnimeReaction = 'like' | 'dislike';

export interface AnimeComment {
  id: string;
  animeId: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface AnimeCommunityEntry {
  animeId: string;
  likes: number;
  dislikes: number;
  viewerReaction: AnimeReaction | null;
  comments: AnimeComment[];
}

const COMMUNITY_KEY = 'kuro_community';
const VIEWER_XP_KEY = 'kuro_viewer_xp';
const XP_PER_LEVEL = 120;
const XP_PER_EPISODE = 35;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    return JSON.parse(localStorage.getItem(key) || '') as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

function getCommunityStore(): Record<string, AnimeCommunityEntry> {
  return readJson<Record<string, AnimeCommunityEntry>>(COMMUNITY_KEY, {});
}

function emptyCommunityEntry(animeId: string): AnimeCommunityEntry {
  return {
    animeId,
    likes: 0,
    dislikes: 0,
    viewerReaction: null,
    comments: [],
  };
}

export function getAnimeCommunity(animeId: number | string): AnimeCommunityEntry {
  const key = String(animeId);
  const entry = getCommunityStore()[key] || emptyCommunityEntry(key);
  return {
    ...emptyCommunityEntry(key),
    ...entry,
    comments: entry.comments || [],
  };
}

export function toggleAnimeReaction(animeId: number | string, reaction: AnimeReaction): AnimeCommunityEntry {
  const key = String(animeId);
  const store = getCommunityStore();
  const entry = { ...getAnimeCommunity(key) };

  if (entry.viewerReaction === reaction) {
    entry[reaction === 'like' ? 'likes' : 'dislikes'] = Math.max(0, entry[reaction === 'like' ? 'likes' : 'dislikes'] - 1);
    entry.viewerReaction = null;
  } else {
    if (entry.viewerReaction === 'like') entry.likes = Math.max(0, entry.likes - 1);
    if (entry.viewerReaction === 'dislike') entry.dislikes = Math.max(0, entry.dislikes - 1);
    entry[reaction === 'like' ? 'likes' : 'dislikes'] += 1;
    entry.viewerReaction = reaction;
  }

  store[key] = entry;
  writeJson(COMMUNITY_KEY, store);
  return entry;
}

export function addAnimeComment(animeId: number | string, body: string, author = 'Kuru viewer'): AnimeCommunityEntry {
  const key = String(animeId);
  const text = body.trim();
  if (!text) return getAnimeCommunity(key);

  const store = getCommunityStore();
  const entry = { ...getAnimeCommunity(key) };
  entry.comments = [
    {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      animeId: key,
      author: author.trim() || 'Kuru viewer',
      body: text.slice(0, 500),
      createdAt: new Date().toISOString(),
    },
    ...entry.comments,
  ].slice(0, 40);

  store[key] = entry;
  writeJson(COMMUNITY_KEY, store);
  return entry;
}

export interface ViewerProgress {
  xp: number;
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
  watchedCount: number;
  watchedEpisodes: Record<string, string>;
}

interface ViewerProgressStore {
  xp?: number;
  watchedEpisodes?: Record<string, string>;
}

function getViewerProgressStore(): Required<ViewerProgressStore> {
  const store = readJson<ViewerProgressStore>(VIEWER_XP_KEY, {});
  return {
    xp: Number(store.xp || 0),
    watchedEpisodes: store.watchedEpisodes || {},
  };
}

function watchedEpisodeKey(animeId: number | string, episode: number) {
  return `${animeId}:${episode}`;
}

export function getViewerProgress(): ViewerProgress {
  const store = getViewerProgressStore();
  const level = Math.floor(store.xp / XP_PER_LEVEL) + 1;
  const currentLevelXp = store.xp % XP_PER_LEVEL;
  return {
    xp: store.xp,
    level,
    currentLevelXp,
    nextLevelXp: XP_PER_LEVEL,
    progressPercent: Math.min(100, Math.round((currentLevelXp / XP_PER_LEVEL) * 100)),
    watchedCount: Object.keys(store.watchedEpisodes).length,
    watchedEpisodes: store.watchedEpisodes,
  };
}

export function hasWatchedEpisode(animeId: number | string, episode: number): boolean {
  return Boolean(getViewerProgressStore().watchedEpisodes[watchedEpisodeKey(animeId, episode)]);
}

export function awardWatchedXp(animeId: number | string, episode: number): { awarded: boolean; gained: number; progress: ViewerProgress } {
  const store = getViewerProgressStore();
  const key = watchedEpisodeKey(animeId, episode);

  if (store.watchedEpisodes[key]) {
    return { awarded: false, gained: 0, progress: getViewerProgress() };
  }

  store.watchedEpisodes[key] = new Date().toISOString();
  store.xp += XP_PER_EPISODE;
  writeJson(VIEWER_XP_KEY, store);
  return { awarded: true, gained: XP_PER_EPISODE, progress: getViewerProgress() };
}
