import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'
import { maskAccount, maskBirth } from '@/lib/admin/mask'

// 신청서 상세. 계좌번호·생년월일은 기본으로 가려서 내려가고,
// ?reveal=1 로 요청했을 때만 전체 값을 내려보낸다(누가 언제 봤는지 서버 로그에 남긴다).
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = requireAdmin(request)
  if (!admin) return unauthorizedResponse()

  const reveal = request.nextUrl.searchParams.get('reveal') === '1'

  try {
    const { data: a, error } = await getSupabaseAdmin()
      .from('electronics_applications')
      .select('*')
      .eq('id', params.id)
      .maybeSingle()
    if (error) throw error
    if (!a) return NextResponse.json({ error: '신청서를 찾을 수 없습니다.' }, { status: 404 })

    if (reveal) {
      console.info(`[Admin] 신청서 민감정보 열람: application=${a.id} admin=${admin.loginId}`)
    }

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
        rentalStatus: a.rental_status,
        existingRentalNote: a.existing_rental_note,

        decideAfterConsult: a.decide_after_consult,
        product: snap.displayName ? `${snap.brand ?? ''} ${snap.displayName}`.trim() : null,
        modelCode: snap.modelCode ?? null,
        planVariant: snap.planVariant ?? null,
        monthlyFee: snap.monthlyFee ?? null,
        contractMonths: a.contract_months,
        careType: a.care_type,

        customerType: a.customer_type,
        name: a.applicant_name,
        birthDate: reveal ? a.birth_date : maskBirth(a.birth_date),
        gender: a.gender,
        carrier: a.carrier,
        phone: a.phone_number,
        agentPhone: a.agent_phone_number,
        email: a.email,

        zonecode: a.zonecode,
        address: a.address,
        addressDetail: a.address_detail,

        giftReceiver: a.gift_receiver,
        giftBank: a.gift_bank,
        giftAccountNumber: reveal ? a.gift_account_number : maskAccount(a.gift_account_number),

        paymentMethod: a.payment_method,
        paymentBank: a.payment_bank,
        paymentAccountNumber: reveal ? a.payment_account_number : maskAccount(a.payment_account_number),
        paymentSameAsGift: a.payment_same_as_gift,

        agreedMarketing: a.agreed_marketing,
        customerNote: a.customer_note,
        referrerUrl: a.referrer_url,
      },
    })
  } catch (error) {
    return routeError('Admin Application', error, '신청서를 불러오지 못했습니다.')
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
  if (!parsed.success) {
    return NextResponse.json({ error: '올바르지 않은 값입니다.' }, { status: 400 })
  }

  try {
    const patch: Record<string, unknown> = {}
    if (parsed.data.status !== undefined) patch.status = parsed.data.status
    if (parsed.data.memo !== undefined) patch.admin_memo = parsed.data.memo.trim() || null

    const { data, error } = await getSupabaseAdmin()
      .from('electronics_applications')
      .update(patch)
      .eq('id', params.id)
      .select('id')
      .maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: '신청서를 찾을 수 없습니다.' }, { status: 404 })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return routeError('Admin Application Update', error, '신청서를 수정하지 못했습니다.')
  }
}
