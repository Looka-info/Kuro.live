/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.myanimelist.net' },
      { protocol: 'https', hostname: 'img.anili.st' },
      { protocol: 'https', hostname: 'media.kitsu.app' },
      { protocol: 'https', hostname: 's4.anilist.co' },
      { protocol: 'https', hostname: '*.anilist.co' },
      { protocol: 'https', hostname: 'gogocdn.net' },
      { protocol: 'https', hostname: '*.gogoanime.tel' },
      { protocol: 'https', hostname: 'img.flawlessfiles.com' },
      { protocol: 'https', hostname: 'anipub.xyz' },
      { protocol: 'https', hostname: 'www.anipub.xyz' },
      { protocol: 'https', hostname: 'cdn.noitatnemucod.net' },
      { protocol: 'https', hostname: 'opwiki.org' },
    ],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
        ],
      },
    ];
  },
};

export default nextConfig;
