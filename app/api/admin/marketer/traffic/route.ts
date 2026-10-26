import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'
import { ALL_ROLES } from '@/lib/admin/auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { rangeDays, trafficDaily, trafficTop } from '@/lib/traffic/query'

// 파트너 본인 링크 유입 추이. 코드는 토큰에서 가져오므로 남의 것을 볼 수 없다.
export async function GET(request: NextRequest) {
  const admin = requireAdmin(request, ALL_ROLES)
  if (!admin) return unauthorizedResponse()
  const days = Math.min(90, Math.max(7, Number(request.nextUrl.searchParams.get('days')) || 30))
  try {
    const { from, to } = rangeDays(days)
    const [daily, referrers, leads] = await Promise.all([
      trafficDaily(days, admin.uniqueCode),
      trafficTop(days, 'referrer', 5, admin.uniqueCode),
      getSupabaseAdmin().from('leads').select('submitted_at').eq('marketer_code', admin.uniqueCode).gte('submitted_at', from.toISOString()).lt('submitted_at', to.toISOString()),
    ])
    // 일별 접수 건수를 방문 추이에 붙인다(방문 → 접수 전환)
    const leadsByDay = new Map<string, number>()
    for (const l of leads.data ?? []) {
      const key = new Date(new Date(l.submitted_at as string).getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10)
      leadsByDay.set(key, (leadsByDay.get(key) ?? 0) + 1)
    }
    const series = daily.map((d) => ({ ...d, leads: leadsByDay.get(d.day) ?? 0 }))
    const totals = series.reduce((a, d) => ({ pageviews: a.pageviews + d.pageviews, visitors: a.visitors + d.visitors, leads: a.leads + d.leads }), { pageviews: 0, visitors: 0, leads: 0 })
    return NextResponse.json({ days, series, totals, referrers })
  } catch (error) {
    return routeError('Marketer Traffic', error, '유입 추이를 불러오지 못했습니다.')
  }
}
