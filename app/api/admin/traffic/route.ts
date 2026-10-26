import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { trafficDaily, trafficTop } from '@/lib/traffic/query'

// 대시보드 방문 추이(대표자·관리자). ?days=30|90
export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return unauthorizedResponse()
  const days = Math.min(365, Math.max(7, Number(request.nextUrl.searchParams.get('days')) || 30))
  try {
    const [daily, paths, referrers, partners, devices, members] = await Promise.all([
      trafficDaily(days),
      trafficTop(days, 'path', 8),
      trafficTop(days, 'referrer', 8),
      trafficTop(days, 'partner', 20),
      trafficTop(days, 'device', 2),
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
