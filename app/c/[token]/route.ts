import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { applicationPathFor } from '@/lib/alimtalk-templates'
import { isShortToken } from '@/lib/shortToken'

// 알림톡 버튼의 짧은 링크. /c/<토큰> → 그 상담 신청의 서비스에 맞는 신청서로 보낸다.
// 토큰은 추측 불가한 8자리이고, 모르는 토큰은 일반 상담 신청 페이지로 보낸다.
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  const fallback = new URL('/apply', request.url)
  if (!isShortToken(params.token)) return NextResponse.redirect(fallback, 302)

  const { data, error } = await getSupabaseAdmin()
    .from('leads')
    .select('id, service')
    .eq('short_token', params.token)
    .maybeSingle()
  if (error) console.error('[c] lead lookup failed:', error.message)
  if (!data) return NextResponse.redirect(fallback, 302)

  return NextResponse.redirect(new URL(applicationPathFor(data.service, data.id), request.url), 302)
}
