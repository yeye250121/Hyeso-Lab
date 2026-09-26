import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { ELECTRONICS_CACHE_TAG } from '@/lib/electronicsApi'

// 상품·이미지를 DB 에서 바꾼 뒤 캐시(unstable_cache, 1시간)를 즉시 비운다.
//   curl -X POST https://www.hyeso.kr/api/revalidate -H "x-revalidate-secret: $REVALIDATE_SECRET"
// REVALIDATE_SECRET 이 설정되지 않은 환경에서는 아무것도 하지 않는다.

export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'REVALIDATE_SECRET is not configured.' }, { status: 503 })
  }
  if (request.headers.get('x-revalidate-secret') !== secret) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  const tag = request.nextUrl.searchParams.get('tag') ?? ELECTRONICS_CACHE_TAG
  revalidateTag(tag)
  return NextResponse.json({ revalidated: true, tag, at: new Date().toISOString() })
}
