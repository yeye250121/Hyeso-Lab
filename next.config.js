/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 최적화 이미지의 캐시 수명. Next 기본값은 60초이고, 실제 TTL은
    // minimumCacheTTL 과 원본 응답의 Cache-Control 중 "더 큰 값"이 쓰인다.
    // Supabase Storage 가 no-cache 를 내려주므로 이 값을 올리지 않으면
    // 이미지가 60초마다 재변환되어 변환 횟수 과금이 폭증한다.
    //
    // 주의: 최적화 캐시는 무효화 수단이 없다. 이미지를 교체할 때는
    // 같은 경로에 덮어쓰지 말고 새 파일명으로 업로드해야 한다.
    minimumCacheTTL: 2678400, // 31일
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
      {
        protocol: 'https',
        hostname: 'd1c5n4ri2guedi.cloudfront.net',
      },
    ],
  },
};

module.exports = nextConfig;
