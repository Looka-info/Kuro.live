# Kuru.live

Anime discovery powered by AniList metadata, with playback handled through MegaPlay embeds
using AniList or MAL IDs.

## Getting Started

1. Install dependencies and run the Kuru.live development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

```dotenv
ANILIST_BASE_URL=https://graphql.anilist.co
MEGAPLAY_BASE_URL=https://megaplay.buzz
ANIKOTO_API_BASE=https://anikotoapi.site
```

Keep server-side values unprefixed unless they are safe to expose with `NEXT_PUBLIC_`.
