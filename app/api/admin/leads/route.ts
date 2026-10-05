import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'

// 상담 신청(명세서) 목록. 전화번호는 연락하려고 보는 화면이라 가리지 않는다.
export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return unauthorizedResponse()

  const sp = request.nextUrl.searchParams
  const service = sp.get('service')
  const status = sp.get('status')
  const q = sp.get('q')?.trim()

  try {
    let query = getSupabaseAdmin()
      .from('leads')
      .select(
        'id, service, category_slug, applicant_name, phone_number, status, admin_memo, product_snapshot, contract_months, care_type, agreed_marketing, referrer_url, marketer_code, alimtalk_sent_at, application_id, statement_sent_at, submitted_at'
      )
      .order('submitted_at', { ascending: false })
      .limit(500)

    if (service) query = query.eq('service', service)
    if (status) query = query.eq('status', status)
    if (q) {
      const safe = q.replace(/[%,()]/g, '')
      query = query.or(`applicant_name.ilike.%${safe}%,phone_number.ilike.%${safe}%`)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({
      leads: (data ?? []).map((l) => {
        const snap = (l.product_snapshot ?? {}) as Record<string, unknown>
        return {
          id: l.id,
          service: l.service,
          categorySlug: l.category_slug,
          name: l.applicant_name,
          phone: l.phone_number,
          status: l.status,
          memo: l.admin_memo ?? '',
          product: snap.displayName ? `${snap.brand ?? ''} ${snap.displayName}`.trim() : null,
          modelCode: (snap.modelCode as string) ?? null,
          monthlyFee: (snap.monthlyFee as number) ?? null,
          contractMonths: l.contract_months,
          careType: l.care_type,
          agreedMarketing: l.agreed_marketing,
          referrerUrl: l.referrer_url,
          marketerCode: l.marketer_code,
          alimtalkSentAt: l.alimtalk_sent_at,
          applicationId: l.application_id,
          statementSentAt: l.statement_sent_at,
          submittedAt: l.submitted_at,
        }
      }),
    })
  } catch (error) {
    return routeError('Admin Leads', error, '상담 신청 목록을 불러오지 못했습니다.')
  }
}
