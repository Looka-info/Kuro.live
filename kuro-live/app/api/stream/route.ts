import { NextRequest, NextResponse } from 'next/server';
import { getMegaPlayStream } from '@/lib/megaplay';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const animeId = searchParams.get('animeId') || searchParams.get('id');
  const malId = searchParams.get('malId') || searchParams.get('idMal');
  const anikotoId = searchParams.get('anikotoId');
  const episode = Number(searchParams.get('episode') || '1');
  const language = searchParams.get('lang') === 'dub' ? 'dub' : 'sub';

  if (animeId || malId || anikotoId) {
    try {
      const episodeNumber = Number.isFinite(episode) && episode > 0 ? episode : 1;
      const result = await getMegaPlayStream({
        animeId,
        malId,
        anikotoId,
        episode: episodeNumber,
        language,
      });

      return NextResponse.json(result, {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=120' },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load stream.';
      const status = /needs an AniList|does not have an embed/i.test(message) ? 404 : 502;
      return NextResponse.json({ error: message, message }, { status });
    }
  }

  return NextResponse.json(
    { error: 'An AniList, MAL, or Anikoto ID is required.' },
    { status: 400 },
  );
}
