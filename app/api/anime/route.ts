import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSeason, getTrending, getPopular, getSeasonal, searchAniList } from '@/lib/anilist';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'trending';
  const limit = parseInt(searchParams.get('limit') || '20');
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('q');
  const season = searchParams.get('season');
  const year = parseInt(searchParams.get('year') || '0');
  const genres = searchParams.get('genres')?.split(',').filter(Boolean);
  const sort = searchParams.get('sort');
  const status = searchParams.get('status');
  const format = searchParams.get('format');

  try {
    if (search || type === 'search') {
      const data = await searchAniList(search || '', page, limit, {
        genres,
        status: status || undefined,
        format: format || undefined,
        sort: sort ? [sort] : undefined,
      });
      return NextResponse.json({ media: data.Page.media, pageInfo: data.Page.pageInfo }, {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
      });
    }

    if (genres?.length) {
      const data = await searchAniList('', page, limit, {
        genres,
        status: status || undefined,
        format: format || undefined,
        sort: [sort || 'POPULARITY_DESC'],
      });
      return NextResponse.json({ media: data.Page.media, pageInfo: data.Page.pageInfo }, {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
      });
    }

    if (type === 'seasonal') {
      const current = getCurrentSeason();
      const targetSeason = season || current.season;
      const targetYear = year || current.year;
      const data = await getSeasonal(targetSeason, targetYear, page, limit);
      return NextResponse.json({ media: data.Page.media, pageInfo: data.Page.pageInfo }, {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' },
      });
    }

    if (type === 'all' || type === 'top' || sort || status || format) {
      const requestedSort = type === 'top' ? 'SCORE_DESC' : sort || 'POPULARITY_DESC';
      const data = await searchAniList('', page, limit, {
        status: status || undefined,
        format: format || undefined,
        sort: [requestedSort],
      });
      return NextResponse.json({ media: data.Page.media, pageInfo: data.Page.pageInfo }, {
        headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=300' },
      });
    }

    if (type === 'popular') {
      const data = await getPopular(page, limit);
      return NextResponse.json({ media: data.Page.media, pageInfo: data.Page.pageInfo }, {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' },
      });
    }

    // Default: trending
    const data = await getTrending(page, limit);
    return NextResponse.json({ media: data.Page.media, pageInfo: data.Page.pageInfo }, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=300' },
    });
  } catch (err: any) {
    console.error('[API/anime]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
