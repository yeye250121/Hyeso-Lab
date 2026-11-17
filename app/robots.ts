import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// 검색 로봇 수집 범위. 관리 콘솔·API·토큰 링크·파트너 랜딩(코드별 중복 페이지)은 수집하지 않게 한다.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/partners/register'],
        disallow: [
          '/api/',
          '/owner/',
          '/admin/',
          '/partners/',
          '/login',
          '/demo',
          '/m/',
          '/s/',
          '/c/',
          '/electronics/search',
          '/electronics/wishlist',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
