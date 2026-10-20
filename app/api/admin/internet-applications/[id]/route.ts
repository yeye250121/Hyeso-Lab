import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'
import { maskAccount } from '@/lib/admin/mask'
import { notifyPartnerForLead } from '@/lib/alimtalk-service'

// 인터넷 신청서 상세. 계좌번호는 기본으로 가려서 내려가고 ?reveal=1 일 때만 전체 값을 준다(열람 로그).
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = requireAdmin(request)
  if (!admin) return unauthorizedResponse()
  const reveal = request.nextUrl.searchParams.get('reveal') === '1'

  try {
    const { data: a, error } = await getSupabaseAdmin().from('internet_applications').select('*').eq('id', params.id).maybeSingle()
    if (error) throw error
    if (!a) return NextResponse.json({ error: '신청서를 찾을 수 없습니다.' }, { status: 404 })
    if (reveal) console.info(`[Admin] 인터넷 신청서 민감정보 열람: application=${a.id} admin=${admin.loginId}`)

    const snap = (a.product_snapshot ?? {}) as Record<string, unknown>
    return NextResponse.json({
      application: {
        id: a.id,
        status: a.status,
        memo: a.admin_memo ?? '',
        submittedAt: a.submitted_at,
        leadId: a.lead_id,
        revealed: reveal,
        statementSentAt: a.statement_sent_at,
        giftAmount: a.gift_amount,
        needsFollowup: a.needs_followup,

        decideAfterConsult: a.decide_after_consult,
        carrierName: snap.carrierName ?? null,
        product: snap.carrierName ? `${snap.speed} ${snap.internetName} · ${snap.addonType === 'none' || !snap.addonName ? '인터넷 단독' : snap.addonName}` : null,
        monthlyFee: snap.monthlyFee ?? null,
        customerGift: snap.customerGift ?? null,
        voucher: snap.voucher ?? null,

        applicantIsSelf: a.applicant_is_self,
        name: a.applicant_name,
        phoneCarrier: a.phone_carrier,
        phone: a.phone_number,

        customerType: a.customer_type,
        businessName: a.business_name,
        businessNumber: a.business_number,
        currentInternet: a.current_internet,
        currentCarrier: a.current_carrier,
        hasMobileBundle: a.has_mobile_bundle,
        zonecode: a.zonecode,
        address: a.address,
        addressDetail: a.address_detail,
        email: a.email,

        giftSkipped: a.gift_skipped,
        giftReceiver: a.gift_receiver,
        giftBank: a.gift_bank,
        giftAccountNumber: reveal ? a.gift_account_number : maskAccount(a.gift_account_number),

        paymentSkipped: a.payment_skipped,
        paymentPayer: a.payment_payer,
        paymentSameAsGift: a.payment_same_as_gift,
        paymentBank: a.payment_bank,
        paymentAccountNumber: reveal ? a.payment_account_number : maskAccount(a.payment_account_number),

        agreedMarketing: a.agreed_marketing,
        customerNote: a.customer_note,
        referrerUrl: a.referrer_url,
      },
    })
  } catch (error) {
    return routeError('Admin Internet Application', error, '신청서를 불러오지 못했습니다.')
  }
}

const updateSchema = z
  .object({
    status: z.enum(['new', 'in_progress', 'contracted', 'cancelled']).optional(),
    memo: z.string().max(2000).optional(),
  })
  .refine((v) => v.status !== undefined || v.memo !== undefined, '변경할 값이 없습니다.')

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!requireAdmin(request)) return unauthorizedResponse()
  const parsed = updateSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: '올바르지 않은 값입니다.' }, { status: 400 })

  try {
    const patch: Record<string, unknown> = {}
    if (parsed.data.status !== undefined) patch.status = parsed.data.status
    if (parsed.data.memo !== undefined) patch.admin_memo = parsed.data.memo.trim() || null
    const db = getSupabaseAdmin()
    const { data: before } = await db.from('internet_applications').select('status, lead_id').eq('id', params.id).maybeSingle()
    const { data, error } = await db.from('internet_applications').update(patch).eq('id', params.id).select('id').maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: '신청서를 찾을 수 없습니다.' }, { status: 404 })

    // 계약 완료/취소로 바뀌면 연결된 파트너에게 알림
    const next = parsed.data.status
    if (next && next !== before?.status && before?.lead_id) {
      if (next === 'contracted') await notifyPartnerForLead(before.lead_id as string, 'contract')
      if (next === 'cancelled') await notifyPartnerForLead(before.lead_id as string, 'cancelled')
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    return routeError('Admin Internet Application Update', error, '신청서를 수정하지 못했습니다.')
  }
}
