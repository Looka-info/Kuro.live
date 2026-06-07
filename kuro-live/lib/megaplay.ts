const MEGAPLAY_BASE =
  process.env.MEGAPLAY_BASE_URL ||
  process.env.NEXT_PUBLIC_MEGAPLAY_BASE_URL ||
  'https://megaplay.buzz';

const ANIKOTO_BASE =
  process.env.ANIKOTO_API_BASE ||
  'https://anikotoapi.site';

const EMBED_REFERER =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  'http://localhost:3000';

type Language = 'sub' | 'dub';

export interface MegaPlayStreamResponse {
  sources: Array<{ url: string; quality: string; isM3U8: boolean }>;
  embedUrl?: string;
  server: 'MegaPlay' | 'Anikoto';
  episodeId?: string;
}

interface AnikotoSeriesResponse {
  ok?: boolean;
  data?: {
    anime?: AnikotoAnime;
    episodes?: AnikotoEpisode[];
  };
  anime?: AnikotoAnime;
  episodes?: AnikotoEpisode[];
}

interface AnikotoRecentResponse {
  ok?: boolean;
  data?: AnikotoAnime[];
  pagination?: {
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
  };
}

export interface AnikotoAnime {
  id?: number | string;
  ani_id?: number | string;
  mal_id?: number | string;
  title?: string;
  name?: string;
  alternative?: string;
  titles?: string;
  year?: number | string;
}

export interface AnikotoEpisode {
  id?: number | string;
  title?: string;
  jp_title?: string;
  number?: number;
  episode?: number;
  episode_embed_id?: number | string;
  embed_url?: {
    sub?: string;
    dub?: string;
  };
}

export interface AnikotoSeries {
  anime?: AnikotoAnime;
  episodes?: AnikotoEpisode[];
}

function cleanBase(value: string) {
  return value.replace(/\/$/, '');
}

function safeEmbedUrl(value: string) {
  const url = new URL(value);
  const hostname = url.hostname.toLowerCase();
  if (url.protocol !== 'https:') throw new Error('Stream embed must use HTTPS.');
  if (hostname !== 'megaplay.buzz' && !hostname.endsWith('.megaplay.buzz')) {
    throw new Error('Stream embed host is not allowed.');
  }
  return url.toString();
}

function uniqueStrings(values: Array<string | undefined | null>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function isRecoverableStreamError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '');
  return /unavailable on the selected embed|does not have an embed|episode file is unavailable|this episode is temporarily unavailable|we'?re sorry|410|selected embed/i.test(message);
}

function numericId(value?: string | null) {
  if (!value || !/^\d+$/.test(value)) return null;
  return value;
}

function normalizeTitle(value?: string | null) {
  return (value || '')
    .toLowerCase()
    .replace(/season\s+\d+/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function anikotoEpisodeToStreamingEpisode(episode: AnikotoEpisode, language: Language = 'sub') {
  const number = episode.number || episode.episode || 0;
  const embedUrl = episode.embed_url?.[language] || episode.embed_url?.sub || episode.embed_url?.dub;
  const fallbackUrl = episode.episode_embed_id
    ? `${cleanBase(MEGAPLAY_BASE)}/stream/s-2/${episode.episode_embed_id}/${language}`
    : '';
  return {
    title: episode.title || (number ? `Episode ${number}` : 'Episode'),
    url: embedUrl || fallbackUrl,
    site: 'Anikoto',
    number,
    episodeId: String(episode.episode_embed_id || episode.id || number),
  };
}

export function anikotoEpisodesToStreamingEpisodes(episodes: AnikotoEpisode[] = [], language: Language = 'sub') {
  return episodes
    .map(episode => anikotoEpisodeToStreamingEpisode(episode, language))
    .filter(episode => episode.url)
    .sort((a, b) => (a.number || 0) - (b.number || 0));
}

export async function getAnikotoSeries(seriesId: string): Promise<AnikotoSeries> {
  const response = await fetch(`${cleanBase(ANIKOTO_BASE)}/series/${encodeURIComponent(seriesId)}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`Anikoto returned ${response.status}.`);
  }

  const data = await response.json() as AnikotoSeriesResponse;
  const series = data.data || data;
  if (!series.episodes?.length && !series.anime) {
    throw new Error('Anikoto does not have this series.');
  }

  return {
    anime: series.anime,
    episodes: series.episodes || [],
  };
}

export async function findAnikotoSeries(options: {
  aniId?: number | string | null;
  malId?: number | string | null;
  title?: string | null;
  year?: number | null;
}): Promise<AnikotoSeries | null> {
  const targetAni = options.aniId ? String(options.aniId) : '';
  const targetMal = options.malId ? String(options.malId) : '';
  const targetTitle = normalizeTitle(options.title);
  const maxPages = 8;

  for (let page = 1; page <= maxPages; page += 1) {
    const response = await fetch(`${cleanBase(ANIKOTO_BASE)}/recent-anime?page=${page}&per_page=100`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 900 },
    });

    if (!response.ok) break;

    const body = await response.json() as AnikotoRecentResponse;
    const rows = body.data || [];
    const match = rows.find(row => {
      const rowAni = row.ani_id ? String(row.ani_id) : '';
      const rowMal = row.mal_id ? String(row.mal_id) : '';
      if (targetAni && rowAni === targetAni) return true;
      if (targetMal && rowMal === targetMal) return true;

      if (!targetTitle) return false;
      const rowTitle = normalizeTitle([row.title, row.alternative, row.titles].filter(Boolean).join(' '));
      const yearMatches = !options.year || !row.year || Number(row.year) === options.year;
      return yearMatches && rowTitle.includes(targetTitle);
    });

    if (match?.id) {
      return getAnikotoSeries(String(match.id));
    }

    if (body.pagination?.total_pages && page >= body.pagination.total_pages) break;
    if (rows.length < 100) break;
  }

  return null;
}

async function isPlayableEmbed(embedUrl: string) {
  try {
    const response = await fetch(embedUrl, {
      headers: {
        Accept: 'text/html',
        Referer: EMBED_REFERER,
      },
      cache: 'no-store',
    });

    if (!response.ok) return false;

    const html = await response.text();
    return !/Error\s*-\s*MegaPlay|Error\s*Code:\s*<span>\s*410\s*<\/span>|We're Sorry!/i.test(html);
  } catch {
    return true;
  }
}

async function requirePlayableEmbed(stream: MegaPlayStreamResponse) {
  if (!stream.embedUrl) return stream;
  const playable = await isPlayableEmbed(stream.embedUrl);
  if (!playable) {
    throw new Error('This episode file is unavailable on the selected embed.');
  }
  return stream;
}

export async function getAnikotoStream(
  seriesId: string,
  episode: number,
  language: Language = 'sub',
): Promise<MegaPlayStreamResponse> {
  const data = await getAnikotoSeries(seriesId);
  const selected = data.episodes?.find(item => (item.number || item.episode) === episode) || data.episodes?.[episode - 1];
  const embedCandidates = uniqueStrings([
    selected?.embed_url?.[language],
    selected?.embed_url?.sub,
    selected?.embed_url?.dub,
  ]);
  const streamCandidates: MegaPlayStreamResponse[] = [
    ...embedCandidates.map(embedUrl => ({
      sources: [],
      embedUrl: safeEmbedUrl(embedUrl),
      server: 'Anikoto' as const,
      episodeId: String(selected?.id || `${seriesId}:${episode}`),
    })),
  ];

  if (selected?.episode_embed_id) {
    streamCandidates.push({
      sources: [],
      embedUrl: safeEmbedUrl(`${cleanBase(MEGAPLAY_BASE)}/stream/s-2/${selected.episode_embed_id}/${language}`),
      server: 'MegaPlay',
      episodeId: String(selected.episode_embed_id),
    });
  }

  let lastError: unknown;
  for (const candidate of streamCandidates) {
    try {
      return await requirePlayableEmbed(candidate);
    } catch (error) {
      lastError = error;
      if (!isRecoverableStreamError(error)) throw error;
    }
  }

  if (lastError instanceof Error) throw lastError;
  throw new Error('This episode is temporarily unavailable.');
}

export async function getMegaPlayStream(options: {
  animeId?: string | null;
  malId?: string | null;
  anikotoId?: string | null;
  episode: number;
  language?: Language;
}): Promise<MegaPlayStreamResponse> {
  const language = options.language || 'sub';
  const anikotoId = options.anikotoId?.replace(/^anikoto:/, '');
  if (anikotoId) {
    try {
      return await getAnikotoStream(anikotoId, options.episode, language);
    } catch (error) {
      if (!isRecoverableStreamError(error)) throw error;
    }
  }

  const anilistId = numericId(options.animeId);
  if (anilistId) {
    try {
      return await requirePlayableEmbed({
        sources: [],
        embedUrl: safeEmbedUrl(`${cleanBase(MEGAPLAY_BASE)}/stream/ani/${anilistId}/${options.episode}/${language}`),
        server: 'MegaPlay',
        episodeId: `${anilistId}:${options.episode}:${language}`,
      });
    } catch (error) {
      if (!options.malId || !isRecoverableStreamError(error)) throw error;
    }
  }

  const malId = numericId(options.malId);
  if (malId) {
    return requirePlayableEmbed({
      sources: [],
      embedUrl: safeEmbedUrl(`${cleanBase(MEGAPLAY_BASE)}/stream/mal/${malId}/${options.episode}/${language}`),
      server: 'MegaPlay',
      episodeId: `${malId}:${options.episode}:${language}`,
    });
  }

  throw new Error('MegaPlay needs an AniList, MAL, or Anikoto ID for this episode.');
}
