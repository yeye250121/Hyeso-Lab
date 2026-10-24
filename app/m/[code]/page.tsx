import { redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import PartnerLanding, { type LandingService } from '@/components/landing/PartnerLanding'

// 파트너 전용 유입 랜딩. /m/<구성원 코드>
// 블로그·SNS 글 → 여기 → 번호 하나만 받는 1차 여과 페이지. 코드는 미들웨어가 쿠키(hl_m)에 남기고,
// 폼은 코드를 직접 실어 보내므로 쿠키가 막혀도 파트너 실적이 잡힌다.
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '다른 곳이 더 주면 차액의 120% 보상 | 혜택연구소',
  description: '광고 모델 없이 그 비용을 전부 고객 지원금으로. 인터넷·가전렌탈 사은품, 상담 전에 먼저 확인하세요.',
}

const SERVICES: LandingService[] = ['internet', 'electronics']

export default async function PartnerLandingPage({ params, searchParams }: { params: { code: string }; searchParams?: Record<string, string | string[] | undefined> }) {
  const code = params.code.trim().slice(0, 40)
  const db = getSupabaseAdmin()
  const { data: partner, error: partnerError } = await db.from('admin_users').select('unique_code, nickname, avatar_url, status').eq('unique_code', code).maybeSingle()
  if (partnerError) console.error('[landing] partner lookup failed:', partnerError.message)
  const serviceParam = Array.isArray(searchParams?.service) ? searchParams?.service[0] : searchParams?.service
  const service = SERVICES.includes(serviceParam as LandingService) ? (serviceParam as LandingService) : null

  // 없는 코드면 일반 상담 신청으로
  if (!partner || partner.status !== 'active') redirect(`/apply${service ? `?service=${service}` : ''}`)

  // 통신사별 최대 사은품(실제 정책표). 가전은 담당자가 금액을 정하므로 숫자를 박지 않는다.
  const { data: gifts } = await db
    .from('internet_products')
    .select('customer_gift, voucher, internet_carriers!inner(name, display_order, business_only)')
    .eq('is_active', true)
  type GiftRow = { customer_gift: number | null; voucher: number | null; internet_carriers: { name: string; display_order: number | null; business_only: boolean | null } }
  const byCarrier = new Map<string, { name: string; order: number; gift: number; voucher: number }>()
  for (const g of (gifts ?? []) as unknown as GiftRow[]) {
    const c = g.internet_carriers
    if (!c || c.business_only || !g.customer_gift) continue
    const cur = byCarrier.get(c.name) ?? { name: c.name, order: c.display_order ?? 99, gift: 0, voucher: 0 }
    cur.gift = Math.max(cur.gift, g.customer_gift)
    cur.voucher = Math.max(cur.voucher, g.voucher ?? 0)
    byCarrier.set(c.name, cur)
  }
  const carriers = [...byCarrier.values()].sort((a, b) => b.gift - a.gift || a.order - b.order)
  const maxGift = carriers.reduce((m, c) => Math.max(m, c.gift + c.voucher), 0)

  // 방문 기록(파트너 홈 퍼널). 파트너 본인이 미리보기로 여는 건 제외
  const preview = Array.isArray(searchParams?.preview) ? searchParams?.preview[0] : searchParams?.preview
  if (!preview) await db.from('landing_views').insert({ marketer_code: partner.unique_code, service })

  return (
    <PartnerLanding
      code={partner.unique_code as string}
      partner={{ nickname: partner.nickname as string, avatarUrl: (partner.avatar_url as string | null) ?? null }}
      initialService={service}
      maxGift={maxGift}
      carriers={carriers}
    />
  )
}
