const WATCHMODE_BASE_URL = 'https://api.watchmode.com/v1';

export type WatchmodeSourceType = 'sub' | 'rent' | 'buy' | 'free' | 'tve';

interface WatchmodeSearchResult {
  id: number;
  name: string;
  type: string;
  year?: number;
}

interface WatchmodeSearchResponse {
  title_results?: WatchmodeSearchResult[];
}

export interface WatchProvider {
  sourceId: number;
  name: string;
  type: WatchmodeSourceType;
  region: string;
  webUrl: string;
  format?: string;
  price?: number | string | null;
  seasons?: number;
  episodes?: number;
}

interface WatchmodeSourceResponse {
  source_id: number;
  name: string;
  type: WatchmodeSourceType;
  region: string;
  web_url?: string;
  ios_url?: string;
  android_url?: string;
  format?: string;
  price?: number | string | null;
  seasons?: number;
  episodes?: number;
}

export class WatchmodeError extends Error {
  constructor(
    message: string,
    public status = 500,
  ) {
    super(message);
    this.name = 'WatchmodeError';
  }
}

function getApiKey() {
  const apiKey = process.env.WATCHMODE_API_KEY?.trim();
  if (!apiKey) {
    throw new WatchmodeError(
      'Watchmode is not configured. Add WATCHMODE_API_KEY to .env.local and restart the development server.',
      503,
    );
  }
  return apiKey;
}

async function watchmodeGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${WATCHMODE_BASE_URL}${path}`);
  url.searchParams.set('apiKey', getApiKey());
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Kuru.live/0.1 (+https://kuru.live)',
      },
      signal: controller.signal,
      next: { revalidate: 21600 },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      const message =
        response.status === 401
          ? 'The Watchmode API key is invalid or inactive.'
          : `Watchmode request failed with status ${response.status}.`;
      throw new WatchmodeError(body ? `${message} ${body.slice(0, 160)}` : message, response.status);
    }

    return response.json();
  } catch (error) {
    if (error instanceof WatchmodeError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new WatchmodeError('Watchmode took too long to respond.', 504);
    }
    throw new WatchmodeError(error instanceof Error ? error.message : 'Watchmode request failed.');
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeTitle(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreResult(result: WatchmodeSearchResult, titles: string[], year?: number) {
  const candidate = normalizeTitle(result.name);
  const titleScore = Math.max(
    ...titles.map(title => {
      const query = normalizeTitle(title);
      if (!query) return 0;
      if (candidate === query) return 1000;
      if (candidate.includes(query) || query.includes(candidate)) return 700;

      const words = new Set(candidate.split(' '));
      return query.split(' ').filter(word => words.has(word)).length * 100;
    }),
  );
  const yearScore = year && result.year ? Math.max(0, 100 - Math.abs(year - result.year) * 25) : 0;
  const typeScore = result.type.includes('tv') ? 25 : 0;
  return titleScore + yearScore + typeScore;
}

export async function getWatchProviders(options: {
  titles: string[];
  year?: number;
  region?: string;
}) {
  const titles = Array.from(new Set(options.titles.map(title => title.trim()).filter(Boolean)));
  if (!titles.length) throw new WatchmodeError('A title is required.', 400);

  const search = await watchmodeGet<WatchmodeSearchResponse>('/search/', {
    search_field: 'name',
    search_value: titles[0],
  });

  const match = [...(search.title_results || [])]
    .sort((a, b) => scoreResult(b, titles, options.year) - scoreResult(a, titles, options.year))[0];

  if (!match) {
    return { match: null, providers: [] as WatchProvider[] };
  }

  const region = (options.region || process.env.WATCHMODE_REGION || 'US').toUpperCase();
  const sources = await watchmodeGet<WatchmodeSourceResponse[]>(
    `/title/${match.id}/sources/`,
    { regions: region },
  );

  const seen = new Set<string>();
  const providers = sources
    .filter(source => source.region === region)
    .map(source => ({
      sourceId: source.source_id,
      name: source.name,
      type: source.type,
      region: source.region,
      webUrl: source.web_url || source.ios_url || source.android_url || '',
      format: source.format,
      price: source.price,
      seasons: source.seasons,
      episodes: source.episodes,
    }))
    .filter(provider => provider.webUrl)
    .filter(provider => {
      const key = `${provider.name}:${provider.type}:${provider.webUrl}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      const order: Record<WatchmodeSourceType, number> = {
        free: 0,
        sub: 1,
        tve: 2,
        rent: 3,
        buy: 4,
      };
      return order[a.type] - order[b.type] || a.name.localeCompare(b.name);
    });

  return {
    match: {
      id: match.id,
      name: match.name,
      type: match.type,
      year: match.year,
    },
    providers,
  };
}
