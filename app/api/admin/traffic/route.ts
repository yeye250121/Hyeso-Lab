import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { rangeDays, rangeFromDates, trafficDaily, trafficTop } from '@/lib/traffic/query'

// 대시보드 방문 추이(대표자·관리자). ?from=YYYY-MM-DD&to=YYYY-MM-DD (한국 날짜, 없으면 최근 30일, 최대 1년)
export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return unauthorizedResponse()
  const sp = request.nextUrl.searchParams
  let range = rangeFromDates(sp.get('from') ?? '', sp.get('to') ?? '') ?? rangeDays(30)
  const span = (range.to.getTime() - range.from.getTime()) / (24 * 3600 * 1000)
  if (span > 366) range = { from: new Date(range.to.getTime() - 366 * 24 * 3600 * 1000), to: range.to }
  const days = Math.round((range.to.getTime() - range.from.getTime()) / (24 * 3600 * 1000))
  try {
    const [daily, paths, referrers, partners, devices, members] = await Promise.all([
      trafficDaily(range),
      trafficTop(range, 'path', 8),
      trafficTop(range, 'referrer', 8),
      trafficTop(range, 'partner', 20),
      trafficTop(range, 'device', 2),
      getSupabaseAdmin().from('admin_users').select('unique_code, nickname'),
    ])
    const nameOf = new Map((members.data ?? []).map((m) => [m.unique_code as string, m.nickname as string]))
    const today = daily[daily.length - 1]
    const totals = daily.reduce((a, d) => ({ pageviews: a.pageviews + d.pageviews, visitors: a.visitors + d.visitors }), { pageviews: 0, visitors: 0 })
    return NextResponse.json({
      days,
      daily,
      today,
      totals,
      paths,
      referrers,
      devices,
      partners: partners.map((p) => ({ ...p, name: nameOf.get(p.key) ?? p.key })),
    })
  } catch (error) {
    return routeError('Admin Traffic', error, '방문 추이를 불러오지 못했습니다.')
  }
}
