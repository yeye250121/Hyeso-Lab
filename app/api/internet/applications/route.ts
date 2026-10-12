import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { routeError } from '@/lib/admin/route'

// 인터넷 신청 접수. 계좌번호가 오가므로 anon 키로는 테이블에 접근할 수 없고 이 라우트에서만 처리한다.

const phone = z.string().regex(/^01[016789]-\d{3,4}-\d{4}$/, '휴대폰 번호 형식이 올바르지 않습니다.')
const account = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v.length >= 8 && v.length <= 16, '계좌번호 형식이 올바르지 않습니다.')
const optionalAccount = z.union([account, z.literal('')]).optional()

const bodySchema = z.object({
  decideAfterConsult: z.boolean().default(false),
  productId: z.string().uuid().nullable().optional(),

  applicantIsSelf: z.boolean().default(true),
  applicantName: z.string().trim().min(1, '이름을 입력해주세요.').max(50),
  phoneCarrier: z.string().trim().max(10).optional(),
  phoneNumber: phone,

  customerType: z.enum(['개인', '개인사업자', '법인사업자', '외국인']),
  businessName: z.string().trim().max(80).optional(),
  businessNumber: z.string().trim().max(14).optional(),
  currentInternet: z.enum(['none', 'using']).nullable().optional(),
  currentCarrier: z.string().trim().max(30).optional(),
  hasMobileBundle: z.boolean().nullable().optional(),
  zonecode: z.string().trim().max(10).optional(),
  address: z.string().trim().min(1, '설치 주소를 입력해주세요.').max(200),
  addressDetail: z.string().trim().max(200).optional().default(''),
  email: z.union([z.string().trim().email('이메일 형식이 올바르지 않습니다.').max(120), z.literal('')]).optional(),

  giftSkipped: z.boolean().default(false),
  giftReceiver: z.string().trim().max(20).optional(),
  giftBank: z.string().trim().max(30).optional(),
  giftAccountNumber: optionalAccount,

  paymentSkipped: z.boolean().default(false),
  paymentPayer: z.enum(['본인', '타인']).nullable().optional(),
  paymentSameAsGift: z.boolean().default(false),
  paymentBank: z.string().trim().max(30).optional(),
  paymentAccountNumber: optionalAccount,

  agreements: z.record(z.boolean()).default({}),
  customerNote: z.string().trim().max(1000).optional(),
  referrerUrl: z.string().trim().max(500).nullable().optional(),
  leadId: z.string().uuid().nullable().optional(),
})

const REQUIRED_AGREEMENTS = ['must_read', 'terms', 'unique_id', 'privacy', 'third_party', 'age14']

export async function POST(request: NextRequest) {
  let p: z.infer<typeof bodySchema>
  try {
    p = bodySchema.parse(await request.json())
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message ?? '입력값을 확인해주세요.' : '요청 형식이 올바르지 않습니다.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
  if (REQUIRED_AGREEMENTS.some((k) => !p.agreements[k])) {
    return NextResponse.json({ error: '필수 약관에 모두 동의해주세요.' }, { status: 400 })
  }
  // 건너뛰지 않았으면 사은품·납부 계좌는 완전해야 한다
  if (!p.giftSkipped && (!p.giftBank || !p.giftAccountNumber)) {
    return NextResponse.json({ error: '사은품 계좌를 입력하거나 나중에 입력하기를 선택해주세요.' }, { status: 400 })
  }
  const useGiftAccount = p.paymentSameAsGift && !p.giftSkipped
  if (!p.paymentSkipped && !useGiftAccount && (!p.paymentBank || !p.paymentAccountNumber)) {
    return NextResponse.json({ error: '납부 계좌를 입력하거나 나중에 입력하기를 선택해주세요.' }, { status: 400 })
  }

  try {
    const db = getSupabaseAdmin()

    // 상품은 서버에서 다시 찾아 접수 시점 조건을 스냅샷으로 남긴다(정책표는 매달 바뀐다)
    let productId: string | null = null
    let snapshot: Record<string, unknown> = {}
    if (!p.decideAfterConsult && p.productId) {
      const { data: product, error } = await db
        .from('internet_products')
        .select('id, carrier_id, internet_name, speed, addon_type, addon_name, monthly_fee, customer_gift, voucher, internet_carriers(name)')
        .eq('id', p.productId)
        .maybeSingle()
      if (error) throw error
      if (product) {
        productId = product.id
        const carrier = product.internet_carriers as unknown as { name: string } | null
        snapshot = {
          carrierId: product.carrier_id,
          carrierName: carrier?.name ?? product.carrier_id,
          internetName: product.internet_name,
          speed: product.speed,
          addonType: product.addon_type,
          addonName: product.addon_name,
          monthlyFee: product.monthly_fee,
          customerGift: product.customer_gift,
          voucher: product.voucher,
          capturedAt: new Date().toISOString(),
        }
      }
    }

    const isBusiness = p.customerType === '개인사업자' || p.customerType === '법인사업자'
    const { data, error } = await db
      .from('internet_applications')
      .insert({
        product_id: productId,
        decide_after_consult: p.decideAfterConsult,
        product_snapshot: snapshot,

        applicant_is_self: p.applicantIsSelf,
        applicant_name: p.applicantName,
        phone_carrier: p.phoneCarrier || null,
        phone_number: p.phoneNumber,

        customer_type: p.customerType,
        business_name: isBusiness ? p.businessName || null : null,
        business_number: isBusiness ? p.businessNumber || null : null,
        current_internet: p.currentInternet ?? null,
        current_carrier: p.currentInternet === 'using' ? p.currentCarrier || null : null,
        has_mobile_bundle: p.currentInternet === 'using' ? p.hasMobileBundle ?? null : null,
        zonecode: p.zonecode || null,
        address: p.address,
        address_detail: p.addressDetail || null,
        email: p.email || null,

        gift_skipped: p.giftSkipped,
        gift_receiver: p.giftSkipped ? null : p.giftReceiver || null,
        gift_bank: p.giftSkipped ? null : p.giftBank || null,
        gift_account_number: p.giftSkipped ? null : p.giftAccountNumber || null,

        payment_skipped: p.paymentSkipped,
        payment_payer: p.paymentSkipped ? null : p.paymentPayer ?? null,
        payment_same_as_gift: !p.paymentSkipped && useGiftAccount,
        payment_bank: p.paymentSkipped ? null : useGiftAccount ? p.giftBank : p.paymentBank || null,
        payment_account_number: p.paymentSkipped ? null : useGiftAccount ? p.giftAccountNumber : p.paymentAccountNumber || null,

        agreed_required: true,
        agreed_marketing: !!p.agreements.marketing,
        customer_note: p.customerNote || null,
        needs_followup: p.giftSkipped || p.paymentSkipped || p.decideAfterConsult,

        referrer_url: p.referrerUrl || null,
        lead_id: p.leadId ?? null,
      })
      .select('id')
      .single()
    if (error) throw error

    if (p.leadId) {
      const { error: leadError } = await db.from('leads').update({ application_id: data.id, status: 'applied' }).eq('id', p.leadId)
      if (leadError) console.error('[internet/applications] lead link failed:', leadError.message)
    }

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (error) {
    return routeError('internet/applications', error, '신청 처리 중 문제가 발생했습니다.')
  }
}
