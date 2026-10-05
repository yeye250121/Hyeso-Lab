import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { ELECTRONICS_CACHE_TAG } from '@/lib/electronicsApi'
import { requireAdmin, unauthorizedResponse } from '@/lib/admin/route'

// 관리자 화면의 "사이트에 바로 반영" 버튼. 렌탈 카탈로그 캐시(1시간)를 즉시 비운다.
export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) return unauthorizedResponse()
  revalidateTag(ELECTRONICS_CACHE_TAG)
  return NextResponse.json({ ok: true, at: new Date().toISOString() })
}
