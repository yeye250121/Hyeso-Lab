import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { routeError } from '@/lib/admin/route'
import { sendCustomerApplicationLinkAlimtalk } from '@/lib/alimtalk-service'

// 상담 신청(명세서) 접수. 카드·인터넷·가전렌탈 공통.
// 필수는 서비스·전화번호·동의뿐이다 — 협력업체가 전화하는 데 그 이상은 필요 없고,
// 받아두면 관리 책임만 생긴다. leads 테이블은 anon 키로 접근할 수 없다.
// 가전렌탈이면 접수 직후 셀프 가입 신청서 링크를 알림톡으로 보낸다.

const phone = z.string().regex(/^01[016789]-\d{3,4}-\d{4}$/, '휴대폰 번호 형식이 올바르지 않습니다.')

const bodySchema = z.object({
  service: z.enum(['card', 'internet', 'electronics'], {
    errorMap: () => ({ message: '어떤 혜택을 알아볼지 골라주세요.' }),
  }),
  phoneNumber: phone,
  applicantName: z.string().trim().max(50).optional().default(''),
  agreedMarketing: z.boolean().default(false),

  // 가전렌탈 상세에서 넘어온 경우
  categorySlug: z.string().trim().max(60).nullable().optional(),
  productSlug: z.string().trim().max(120).nullable().optional(),
  planId: z.string().uuid().nullable().optional(),
  contractMonths: z.number().int().positive().max(240).nullable().optional(),
  careType: z.string().trim().max(20).nullable().optional(),

  referrerUrl: z.string().trim().max(500).nullable().optional(),
  marketerCode: z.string().trim().max(40).optional(),
})

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

  try {
    const supabaseAdmin = getSupabaseAdmin()

    // 상품/요금제 확정. 클라이언트가 보낸 planId 는 신뢰하지 않고 서버에서 다시 찾는다.
    let productId: string | null = null
    let planId: string | null = null
    let contractMonths = parsed.contractMonths ?? null
    let careType = parsed.careType ?? null
    let snapshot: Record<string, unknown> = {}

    if (parsed.service === 'electronics' && parsed.productSlug) {
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
          if (contractMonths) planQuery = planQuery.eq('contract_months', contractMonths)
          if (careType) planQuery = planQuery.eq('care_type', careType)
        }

        const { data: plans, error: planError } = await planQuery
        if (planError) throw planError

        const plan = plans?.[0]
        if (plan) {
          planId = plan.id
          contractMonths = plan.contract_months
          careType = plan.care_type
        }

        // 정책표는 매달 바뀐다. 접수 시점의 조건을 남겨둬야 상담원이 같은 얘기를 한다.
        snapshot = {
          brand: product.brand,
          modelCode: product.model_code,
          displayName: product.display_name,
          slug: product.slug,
          contractMonths,
          careType,
          planVariant: plan?.plan_variant ?? null,
          monthlyFee: plan?.monthly_fee ?? null,
          listPrice: plan?.list_price ?? null,
          capturedAt: new Date().toISOString(),
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert({
        service: parsed.service,
        category_slug: parsed.service === 'electronics' ? parsed.categorySlug ?? null : null,
        product_id: productId,
        plan_id: planId,
        contract_months: productId ? contractMonths : null,
        care_type: productId ? careType : null,
        product_snapshot: snapshot,
        applicant_name: parsed.applicantName || null,
        phone_number: parsed.phoneNumber,
        agreed_required: true,
        agreed_marketing: parsed.agreedMarketing,
        referrer_url: parsed.referrerUrl || null,
        marketer_code: parsed.marketerCode || '',
      })
      .select('id')
      .single()

    if (error) throw error

    // 알림톡은 접수와 별개다. 실패해도 접수는 유효하고, 완료 화면에 링크가 따로 있다.
    if (parsed.service === 'electronics') {
      const sent = await sendCustomerApplicationLinkAlimtalk(parsed.phoneNumber, data.id)
      if (sent.success) {
        await supabaseAdmin
          .from('leads')
          .update({ alimtalk_sent_at: new Date().toISOString() })
          .eq('id', data.id)
      }
    }

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (error) {
    return routeError('leads', error, '신청 처리 중 문제가 발생했습니다.')
  }
}
