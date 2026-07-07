/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hvwgs4k77hcs8ntu.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'yknptcjxrizgccxczzuy.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'urxbdqmrsfzmztkacfiv.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'ktollehcctv.co',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'www.truck-kbcard.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.thefairnews.co.kr',
      },
    ],
  },
};

module.exports = nextConfig;
