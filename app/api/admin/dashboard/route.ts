import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'

// 대시보드: 지금 처리해야 할 것(미처리 상담 신청·신청서)과 최근 유입을 보여준다.
export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return unauthorizedResponse()

  try {
    const db = getSupabaseAdmin()
    // 한국 시간 기준 오늘 0시
    const now = new Date()
    const kst = new Date(now.getTime() + 9 * 3600 * 1000)
    const todayStart = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) - 9 * 3600 * 1000)
    const weekStart = new Date(todayStart.getTime() - 6 * 24 * 3600 * 1000)

    const [leads, apps, products] = await Promise.all([
      db.from('leads').select('id, service, status, applicant_name, phone_number, product_snapshot, submitted_at').order('submitted_at', { ascending: false }).limit(1000),
      db.from('electronics_applications').select('id, status, submitted_at').order('submitted_at', { ascending: false }).limit(1000),
      db.from('electronics_products').select('id, is_active, image_urls'),
    ])
    const error = leads.error || apps.error || products.error
    if (error) throw error

    const L = leads.data ?? []
    const A = apps.data ?? []
    const P = products.data ?? []
    const since = (rows: { submitted_at: string }[], from: Date) => rows.filter((r) => new Date(r.submitted_at) >= from).length

    const byService: Record<string, number> = { card: 0, internet: 0, electronics: 0 }
    for (const l of L) byService[l.service] = (byService[l.service] ?? 0) + 1

    // 최근 7일 일별 유입
    const daily: { date: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const from = new Date(todayStart.getTime() - i * 24 * 3600 * 1000)
      const to = new Date(from.getTime() + 24 * 3600 * 1000)
      const label = new Date(from.getTime() + 9 * 3600 * 1000)
      daily.push({
        date: `${label.getUTCMonth() + 1}/${label.getUTCDate()}`,
        count: L.filter((l) => new Date(l.submitted_at) >= from && new Date(l.submitted_at) < to).length,
      })
    }

    const active = P.filter((p) => p.is_active)
    return NextResponse.json({
      leads: {
        total: L.length,
        today: since(L, todayStart),
        week: since(L, weekStart),
        unprocessed: L.filter((l) => l.status === 'new').length,
        byService,
        daily,
      },
      applications: {
        total: A.length,
        today: since(A, todayStart),
        unprocessed: A.filter((a) => a.status === 'new').length,
      },
      products: {
        active: active.length,
        inactive: P.length - active.length,
        withoutImage: active.filter((p) => !p.image_urls?.length).length,
      },
      recentLeads: L.slice(0, 8).map((l) => {
        const snap = (l.product_snapshot ?? {}) as Record<string, unknown>
        return {
          id: l.id,
          service: l.service,
          name: l.applicant_name || '이름 미입력',
          phone: l.phone_number,
          product: snap.displayName ? `${snap.brand ?? ''} ${snap.displayName}`.trim() : null,
          status: l.status,
          submittedAt: l.submitted_at,
        }
      }),
    })
  } catch (error) {
    return routeError('Admin Dashboard', error, '대시보드를 불러오지 못했습니다.')
  }
}
