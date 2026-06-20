// AniList GraphQL API — graphql.anilist.co
// Free, no key needed. Rate limit: 90 req/min
// Best search engine — used for: search, character info, staff, studio data, relations

const ANILIST_URL = process.env.ANILIST_BASE_URL || 'https://graphql.anilist.co';

export interface AniListMedia {
  id: number | string;
  anikotoId?: number | string;
  malId?: number;
  idMal?: number;
  title: {
    romaji?: string;
    english?: string;
    native?: string;
    userPreferred?: string;
  };
  description?: string;
  bannerImage?: string;
  coverImage: {
    extraLarge?: string;
    large?: string;
    medium?: string;
    color?: string;
  };
  format?: string;
  status?: string;
  episodes?: number;
  duration?: number;
  chapters?: number;
  volumes?: number;
  season?: string;
  seasonYear?: number;
  averageScore?: number;
  meanScore?: number;
  popularity?: number;
  favourites?: number;
  trending?: number;
  genres?: string[];
  tags?: Array<{ name: string; rank: number; category: string }>;
  studios?: { nodes: Array<{ name: string; isAnimationStudio: boolean }> };
  characters?: {
    edges: Array<{
      role: string;
      node: {
        id: number;
        name: { full: string };
        image: { large?: string; medium?: string };
      };
      voiceActorRoles?: Array<{
        voiceActor: {
          id: number;
          name: { full: string };
          image: { large?: string };
          language?: string;
        };
      }>;
    }>;
  };
  relations?: {
    edges: Array<{
      relationType: string;
      node: {
        id: number | string;
        title: { romaji?: string; english?: string };
        coverImage: { medium?: string };
        format?: string;
        status?: string;
      };
    }>;
  };
  trailer?: { id?: string; site?: string; thumbnail?: string };
  externalLinks?: Array<{ site?: string; url?: string }>;
  streamingEpisodes?: Array<{
    title?: string;
    thumbnail?: string;
    url: string;
    site: string;
    number?: number;
    episodeId?: string;
  }>;
  nextAiringEpisode?: { airingAt: number; episode: number };
  rankings?: Array<{ rank: number; type: string; context: string; allTime: boolean; season?: string; year?: number }>;
}

export interface AniListPageInfo {
  total: number;
  hasNextPage: boolean;
  currentPage: number;
}

export type AniListPageResponse = {
  Page: {
    media: AniListMedia[];
    pageInfo: AniListPageInfo;
  };
};

async function anilistQuery<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  const res = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'Kuru.live/0.1 (+https://kuru.live)',
    },
    body: JSON.stringify({ query, variables }),
    signal: controller.signal,
    next: { revalidate: 300 },
  }).finally(() => clearTimeout(timeout));

  if (!res.ok) {
    const retryAfter = res.headers.get('retry-after');
    throw new Error(`AniList error ${res.status}${retryAfter ? ` retry-after=${retryAfter}s` : ''}`);
  }

  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message || 'AniList GraphQL error');
  return json.data;
}

// ── GraphQL Fragments ────────────────────────────────────

const MEDIA_FRAGMENT = `
  fragment MediaFields on Media {
    id
    idMal
    title { romaji english native userPreferred }
    description(asHtml: false)
    bannerImage
    coverImage { extraLarge large medium color }
    format status episodes duration season seasonYear
    averageScore meanScore popularity favourites trending
    genres
    studios(isMain: true) { nodes { name isAnimationStudio } }
    trailer { id site thumbnail }
    nextAiringEpisode { airingAt episode }
    tags { name rank category }
  }
`;

// ── Exports ──────────────────────────────────────────────

export async function searchAniList(
  search: string,
  page = 1,
  perPage = 20,
  filters: {
    genres?: string[];
    year?: number;
    season?: string;
    format?: string;
    status?: string;
    sort?: string[];
    minimumTagRank?: number;
  } = {}
): Promise<AniListPageResponse> {
  const query = `
    ${MEDIA_FRAGMENT}
    query SearchAnime($search: String, $page: Int, $perPage: Int, $genres: [String], $year: Int, $season: MediaSeason, $format: MediaFormat, $status: MediaStatus, $sort: [MediaSort]) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total hasNextPage currentPage }
        media(search: $search, type: ANIME, genre_in: $genres, seasonYear: $year, season: $season, format: $format, status: $status, sort: $sort, isAdult: false) {
          ...MediaFields
        }
      }
    }
  `;
  return anilistQuery(query, {
    search: search || undefined,
    page,
    perPage,
    genres: filters.genres?.length ? filters.genres : undefined,
    year: filters.year || undefined,
    season: filters.season?.toUpperCase() || undefined,
    format: filters.format?.toUpperCase() || undefined,
    status: filters.status?.toUpperCase() || undefined,
    sort: filters.sort || (search ? ['SEARCH_MATCH'] : ['TRENDING_DESC']),
  });
}

export async function getTrending(page = 1, perPage = 20): Promise<AniListPageResponse> {
  const query = `
    ${MEDIA_FRAGMENT}
    query Trending($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total hasNextPage currentPage }
        media(sort: [TRENDING_DESC], type: ANIME, isAdult: false) {
          ...MediaFields
        }
      }
    }
  `;
  return anilistQuery(query, { page, perPage });
}

export async function getPopular(page = 1, perPage = 20): Promise<AniListPageResponse> {
  const query = `
    ${MEDIA_FRAGMENT}
    query Popular($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total hasNextPage currentPage }
        media(sort: [POPULARITY_DESC], type: ANIME, isAdult: false) {
          ...MediaFields
        }
      }
    }
  `;
  return anilistQuery(query, { page, perPage });
}

export async function getSeasonal(season: string, year: number, page = 1, perPage = 20): Promise<AniListPageResponse> {
  const query = `
    ${MEDIA_FRAGMENT}
    query Seasonal($season: MediaSeason!, $year: Int!, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total hasNextPage currentPage }
        media(season: $season, seasonYear: $year, type: ANIME, sort: [POPULARITY_DESC], isAdult: false) {
          ...MediaFields
        }
      }
    }
  `;
  return anilistQuery(query, { season: season.toUpperCase(), year, page, perPage });
}

export async function getAniListById(id: number): Promise<{ Media: AniListMedia | null }> {
  const query = `
    query GetMedia($id: Int) {
      Media(id: $id, type: ANIME) {
        id idMal
        title { romaji english native userPreferred }
        description(asHtml: false)
        bannerImage
        coverImage { extraLarge large medium color }
        format status episodes duration season seasonYear
        averageScore meanScore popularity favourites trending
        genres tags { name rank category }
        studios { nodes { name isAnimationStudio } }
        trailer { id site thumbnail }
        streamingEpisodes { title thumbnail url site }
        nextAiringEpisode { airingAt episode }
        characters(sort: [ROLE, RELEVANCE], perPage: 12) {
          edges {
            role
            node { id name { full } image { large medium } }
            voiceActorRoles(language: JAPANESE) {
              voiceActor { id name { full } image { large } language }
            }
          }
        }
        relations {
          edges {
            relationType
            node { id title { romaji english } coverImage { medium } format status }
          }
        }
        externalLinks { site url }
        rankings { rank type context allTime season year }
      }
    }
  `;
  return anilistQuery(query, { id });
}

export async function getAniListByMalId(idMal: number): Promise<{ Media: AniListMedia | null }> {
  const query = `
    query GetMediaByMalId($idMal: Int) {
      Media(idMal: $idMal, type: ANIME) {
        id idMal
        title { romaji english native userPreferred }
        description(asHtml: false)
        bannerImage
        coverImage { extraLarge large medium color }
        format status episodes duration season seasonYear
        averageScore meanScore popularity favourites trending
        genres tags { name rank category }
        studios { nodes { name isAnimationStudio } }
        trailer { id site thumbnail }
        streamingEpisodes { title thumbnail url site }
        nextAiringEpisode { airingAt episode }
        characters(sort: [ROLE, RELEVANCE], perPage: 12) {
          edges {
            role
            node { id name { full } image { large medium } }
            voiceActorRoles(language: JAPANESE) {
              voiceActor { id name { full } image { large } language }
            }
          }
        }
        relations {
          edges {
            relationType
            node { id title { romaji english } coverImage { medium } format status }
          }
        }
        externalLinks { site url }
        rankings { rank type context allTime season year }
      }
    }
  `;
  return anilistQuery(query, { idMal });
}

export async function getAiringSchedule(): Promise<{ Page: { airingSchedules: any[] } }> {
  const query = `
    query AiringSchedule($from: Int, $to: Int) {
      Page(perPage: 20) {
        airingSchedules(airingAt_greater: $from, airingAt_lesser: $to, sort: [TIME]) {
          airingAt episode media { id title { romaji english } coverImage { large } }
        }
      }
    }
  `;
  const now = Math.floor(Date.now() / 1000);
  return anilistQuery(query, { from: now, to: now + 86400 * 7 });
}

export function getCurrentSeason(): { season: string; year: number } {
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const seasons: Record<number, string> = { 1: 'WINTER', 2: 'WINTER', 3: 'SPRING', 4: 'SPRING', 5: 'SPRING', 6: 'SUMMER', 7: 'SUMMER', 8: 'SUMMER', 9: 'FALL', 10: 'FALL', 11: 'FALL', 12: 'WINTER' };
  return { season: seasons[month], year };
}

export const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
  'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological',
  'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller',
];
