import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// 마케터 전용 유입 링크. /m/<구성원 코드> 로 들어오면 코드를 쿠키(30일)에 남기고 상담 신청으로 보낸다.
// 상담 신청이 접수될 때 이 코드가 leads.marketer_code 에 찍혀 마케터별 성과를 센다.
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
  const code = params.code.trim().slice(0, 40)
  const target = new URL('/apply', request.url)
  const service = request.nextUrl.searchParams.get('service')
  if (service) target.searchParams.set('service', service)

  const { data } = await getSupabaseAdmin().from('admin_users').select('unique_code').eq('unique_code', code).maybeSingle()
  if (!data) return NextResponse.redirect(target, 302)

  target.searchParams.set('m', code)
  const res = NextResponse.redirect(target, 302)
  res.cookies.set('hl_m', code, { path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax' })
  return res
}
