import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { routeError } from '@/lib/admin/route'

// 렌탈 신청 접수. 계좌번호/생년월일 같은 민감정보가 오가므로 anon 키로는
// 테이블에 접근할 수 없게 막아두고(마이그레이션 참고) 이 라우트에서만 처리한다.

const phone = z.string().regex(/^01[016789]-\d{3,4}-\d{4}$/, '휴대폰 번호 형식이 올바르지 않습니다.')
const account = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v.length >= 8 && v.length <= 16, '계좌번호 형식이 올바르지 않습니다.')

const bodySchema = z.object({
  // 1
  decideAfterConsult: z.boolean().default(false),
  productSlug: z.string().trim().min(1).max(120).nullable().optional(),
  planId: z.string().uuid().nullable().optional(),
  contractMonths: z.number().int().positive().max(240).nullable().optional(),
  careType: z.string().trim().max(20).nullable().optional(),
  categorySlug: z.string().trim().max(60).nullable().optional(),

  // 2
  customerType: z.enum(['개인', '개인사업자', '법인사업자', '외국인']),
  applicantName: z.string().trim().min(1, '가입자명을 입력해주세요.').max(50),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '생년월일 형식이 올바르지 않습니다.'),
  gender: z.enum(['남성', '여성']),
  carrier: z.string().trim().min(1).max(20),
  phoneNumber: phone,
  useAgentPhone: z.boolean().default(false),
  agentPhoneNumber: z.union([phone, z.literal('')]).optional(),
  email: z.string().trim().email('이메일 형식이 올바르지 않습니다.').max(120),

  // 3
  zonecode: z.string().trim().max(10).optional(),
  address: z.string().trim().min(1, '설치 주소를 입력해주세요.').max(200),
  addressDetail: z.string().trim().min(1, '상세주소를 입력해주세요.').max(200),

  // 4
  giftReceiver: z.string().trim().min(1).max(20),
  giftBank: z.string().trim().min(1, '은행을 선택해주세요.').max(30),
  giftAccountNumber: account,

  // 5
  paymentSkipped: z.boolean().default(false),
  paymentMethod: z.enum(['은행 자동이체', '카드 결제']).nullable().optional(),
  paymentSameAsGift: z.boolean().default(false),
  paymentBank: z.string().trim().max(30).optional(),
  paymentAccountNumber: z.union([account, z.literal('')]).optional(),

  // 6
  agreements: z.record(z.boolean()).default({}),
  customerNote: z.string().trim().max(1000).optional(),

  referrerUrl: z.string().trim().max(500).nullable().optional(),
  marketerCode: z.string().trim().max(40).optional(),
})

const REQUIRED_AGREEMENTS = ['must_read', 'terms', 'unique_id', 'privacy', 'third_party', 'age14']

export async function POST(request: NextRequest) {
  let parsed: z.infer<typeof bodySchema>
  try {
    parsed = bodySchema.parse(await request.json())
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? '입력값을 확인해주세요.'
        : '요청 형식이 올바르지 않습니다.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const missing = REQUIRED_AGREEMENTS.filter((key) => !parsed.agreements[key])
  if (missing.length > 0) {
    return NextResponse.json({ error: '필수 약관에 모두 동의해주세요.' }, { status: 400 })
  }

  try {
    const supabaseAdmin = getSupabaseAdmin()

    // 상품/요금제 확정. 클라이언트가 보낸 planId 는 신뢰하지 않고 서버에서 다시 찾는다.
    let productId: string | null = null
    let planId: string | null = null
    let snapshot: Record<string, unknown> = {}

    if (!parsed.decideAfterConsult && parsed.productSlug) {
      const { data: product, error: productError } = await supabaseAdmin
        .from('electronics_products')
        .select('id, brand, model_code, display_name, slug')
        .eq('slug', parsed.productSlug)
        .maybeSingle()
      if (productError) throw productError

      if (product) {
        productId = product.id

        let planQuery = supabaseAdmin
          .from('electronics_product_plans')
          .select('id, contract_months, care_type, plan_variant, monthly_fee, list_price')
          .eq('product_id', product.id)
          .order('monthly_fee', { ascending: true })
          .limit(1)

        if (parsed.planId) planQuery = planQuery.eq('id', parsed.planId)
        else {
          if (parsed.contractMonths) planQuery = planQuery.eq('contract_months', parsed.contractMonths)
          if (parsed.careType) planQuery = planQuery.eq('care_type', parsed.careType)
        }

        const { data: plans, error: planError } = await planQuery
        if (planError) throw planError

        const plan = plans?.[0]
        if (plan) planId = plan.id

        // 정책표는 매달 바뀐다. 접수 시점의 조건을 그대로 남겨둬야 나중에 분쟁이 없다.
        snapshot = {
          brand: product.brand,
          modelCode: product.model_code,
          displayName: product.display_name,
          slug: product.slug,
          categorySlug: parsed.categorySlug ?? null,
          contractMonths: plan?.contract_months ?? parsed.contractMonths ?? null,
          careType: plan?.care_type ?? parsed.careType ?? null,
          planVariant: plan?.plan_variant ?? null,
          monthlyFee: plan?.monthly_fee ?? null,
          listPrice: plan?.list_price ?? null,
          capturedAt: new Date().toISOString(),
        }
      }
    }

    const usesGiftAccount = parsed.paymentSameAsGift && parsed.paymentMethod === '은행 자동이체'

    const { data, error } = await supabaseAdmin
      .from('electronics_applications')
      .insert({
        product_id: productId,
        plan_id: planId,
        decide_after_consult: parsed.decideAfterConsult,
        contract_months: parsed.contractMonths ?? null,
        care_type: parsed.careType ?? null,
        product_snapshot: snapshot,

        customer_type: parsed.customerType,
        applicant_name: parsed.applicantName,
        birth_date: parsed.birthDate,
        gender: parsed.gender,
        carrier: parsed.carrier,
        phone_number: parsed.phoneNumber,
        agent_phone_number: parsed.useAgentPhone ? parsed.agentPhoneNumber || null : null,
        email: parsed.email,

        zonecode: parsed.zonecode || null,
        address: parsed.address,
        address_detail: parsed.addressDetail,

        gift_receiver: parsed.giftReceiver,
        gift_bank: parsed.giftBank,
        gift_account_number: parsed.giftAccountNumber,

        payment_method: parsed.paymentSkipped ? null : parsed.paymentMethod ?? null,
        payment_bank: parsed.paymentSkipped
          ? null
          : usesGiftAccount
            ? parsed.giftBank
            : parsed.paymentBank || null,
        payment_account_number: parsed.paymentSkipped
          ? null
          : usesGiftAccount
            ? parsed.giftAccountNumber
            : parsed.paymentAccountNumber || null,
        payment_same_as_gift: parsed.paymentSameAsGift,

        agreed_required: true,
        agreed_marketing: !!parsed.agreements.marketing,
        customer_note: parsed.customerNote || null,

        referrer_url: parsed.referrerUrl || null,
        marketer_code: parsed.marketerCode || '',
      })
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (error) {
    return routeError('electronics/applications', error, '신청 처리 중 문제가 발생했습니다.')
  }
}
