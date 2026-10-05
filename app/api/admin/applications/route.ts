import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'

// 신청서(6단계 셀프 가입) 목록. 계좌·생년월일 같은 민감정보는 목록에 싣지 않는다.
export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return unauthorizedResponse()

  const sp = request.nextUrl.searchParams
  const status = sp.get('status')
  const q = sp.get('q')?.trim()

  try {
    let query = getSupabaseAdmin()
      .from('electronics_applications')
      .select(
        'id, applicant_name, phone_number, customer_type, status, decide_after_consult, product_snapshot, contract_months, care_type, address, lead_id, admin_memo, submitted_at'
      )
      .order('submitted_at', { ascending: false })
      .limit(500)

    if (status) query = query.eq('status', status)
    if (q) {
      const safe = q.replace(/[%,()]/g, '')
      query = query.or(`applicant_name.ilike.%${safe}%,phone_number.ilike.%${safe}%`)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({
      applications: (data ?? []).map((a) => {
        const snap = (a.product_snapshot ?? {}) as Record<string, unknown>
        return {
          id: a.id,
          name: a.applicant_name,
          phone: a.phone_number,
          customerType: a.customer_type,
          status: a.status,
          decideAfterConsult: a.decide_after_consult,
          product: snap.displayName ? `${snap.brand ?? ''} ${snap.displayName}`.trim() : null,
          monthlyFee: (snap.monthlyFee as number) ?? null,
          contractMonths: a.contract_months,
          careType: a.care_type,
          // 목록에는 시/구까지만
          region: a.address ? a.address.split(' ').slice(0, 2).join(' ') : null,
          leadId: a.lead_id,
          memo: a.admin_memo ?? '',
          submittedAt: a.submitted_at,
        }
      }),
    })
  } catch (error) {
    return routeError('Admin Applications', error, '신청서 목록을 불러오지 못했습니다.')
  }
}
