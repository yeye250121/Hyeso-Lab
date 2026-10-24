import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'
import { ALL_ROLES } from '@/lib/admin/auth'
import { maskName } from '@/lib/admin/mask'

// 마케터 홈. 본인 코드로 들어온 상담 신청만 센다(코드는 토큰에서 가져오므로 바꿀 수 없다).
export async function GET(request: NextRequest) {
  const admin = requireAdmin(request, ALL_ROLES)
  if (!admin) return unauthorizedResponse()
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('leads')
      .select('id, service, status, applicant_name, application_id, submitted_at')
      .eq('marketer_code', admin.uniqueCode)
      .order('submitted_at', { ascending: false })
      .limit(1000)
    if (error) throw error
    const rows = data ?? []
    const now = new Date()
    // 랜딩 방문(이번 달·전체). 실패해도 현황은 보여준다
    const views = await getSupabaseAdmin().from('landing_views').select('created_at').eq('marketer_code', admin.uniqueCode).order('created_at', { ascending: false }).limit(5000)
    const viewRows = views.data ?? []
    const kst = new Date(now.getTime() + 9 * 3600 * 1000)
    const monthStart = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), 1) - 9 * 3600 * 1000)
    const thisMonth = rows.filter((r) => new Date(r.submitted_at) >= monthStart)
    const count = (list: typeof rows, s: string) => list.filter((r) => r.status === s).length

    // 최근 8주 주별 인입
    const weekly: { label: string; count: number }[] = []
    for (let i = 7; i >= 0; i--) {
      const from = new Date(now.getTime() - (i + 1) * 7 * 24 * 3600 * 1000)
      const to = new Date(now.getTime() - i * 7 * 24 * 3600 * 1000)
      const l = new Date(to.getTime() + 9 * 3600 * 1000)
      weekly.push({ label: `${l.getUTCMonth() + 1}/${l.getUTCDate()}`, count: rows.filter((r) => new Date(r.submitted_at) >= from && new Date(r.submitted_at) < to).length })
    }

    return NextResponse.json({
      code: admin.uniqueCode,
      month: { total: thisMonth.length, new: count(thisMonth, 'new'), contacted: count(thisMonth, 'contacted'), applied: count(thisMonth, 'applied'), closed: count(thisMonth, 'closed'), views: viewRows.filter((v) => new Date(v.created_at) >= monthStart).length },
      all: { total: rows.length, applied: count(rows, 'applied'), closed: count(rows, 'closed'), views: viewRows.length },
      weekly,
      recent: rows.slice(0, 5).map((r) => ({ id: r.id, service: r.service, status: r.status, name: maskName(r.applicant_name), hasApplication: !!r.application_id, submittedAt: r.submitted_at })),
    })
  } catch (error) {
    return routeError('Marketer Summary', error, '현황을 불러오지 못했습니다.')
  }
}
