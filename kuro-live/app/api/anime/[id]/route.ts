import { NextRequest, NextResponse } from 'next/server';
import type { AniListMedia } from '@/lib/anilist';
import { getAniListById, getAniListByMalId } from '@/lib/anilist';
import type { AnikotoEpisode } from '@/lib/megaplay';
import { anikotoEpisodesToStreamingEpisodes, findAnikotoSeries, getAnikotoSeries } from '@/lib/megaplay';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const numericId = parseInt(id, 10);

  try {
    if (isNaN(numericId)) throw new Error('Invalid ID');
    let data: AniListMedia | null = null;
    let anikotoId: string | undefined;
    let anikotoEpisodes: AnikotoEpisode[] = [];

    try {
      data = (await getAniListById(numericId)).Media;
    } catch (error: any) {
      if (!/AniList error 404|not found/i.test(error?.message || '')) throw error;
    }

    if (!data) {
      try {
        data = (await getAniListByMalId(numericId)).Media;
      } catch (error: any) {
        if (!/AniList error 404|not found/i.test(error?.message || '')) throw error;
      }
    }

    if (!data) {
      try {
        const anikoto = await getAnikotoSeries(String(numericId));
        anikotoEpisodes = anikoto.episodes || [];
        const aniId = anikoto.anime?.ani_id;
        if (aniId && /^\d+$/.test(String(aniId))) {
          data = (await getAniListById(Number(aniId))).Media;
          anikotoId = String(anikoto.anime?.id || numericId);
        }
      } catch (error: any) {
        if (!/Anikoto returned 404|does not have this series|not found/i.test(error?.message || '')) throw error;
      }
    }

    if (!data) {
      return NextResponse.json({ error: 'Anime not found' }, { status: 404 });
    }

    if (!anikotoId) {
      try {
        const anikoto = await findAnikotoSeries({
          aniId: data.id,
          malId: data.idMal || data.malId,
          title: data.title.english || data.title.romaji || data.title.userPreferred,
          year: data.seasonYear || null,
        });
        if (anikoto?.anime?.id) {
          anikotoId = String(anikoto.anime.id);
          anikotoEpisodes = anikoto.episodes || [];
        }
      } catch {
        // AniList metadata remains the source of truth; Anikoto is only used to enrich episode availability.
      }
    }

    const mappedEpisodes = anikotoEpisodesToStreamingEpisodes(anikotoEpisodes);
    const enriched = {
      ...data,
      ...(anikotoId ? { anikotoId } : {}),
      ...(mappedEpisodes.length ? {
        streamingEpisodes: mappedEpisodes,
        episodes: Math.max(Number(data.episodes || 0), mappedEpisodes.length),
      } : {}),
    };

    return NextResponse.json(enriched, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' },
    });
  } catch (err: any) {
    const message = err?.message || 'Failed to load anime';
    const status = /AniList error 404|not found/i.test(message) ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? 'Anime not found' : message }, { status });
  }
}
