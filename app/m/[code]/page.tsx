import { redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import PartnerLanding, { type LandingService, type GiftCase } from '@/components/landing/PartnerLanding'
import { maskName } from '@/lib/admin/mask'

// 파트너 전용 유입 랜딩. /m/<구성원 코드>
// 블로그·SNS 글 → 여기 → 번호 하나만 받는 1차 여과 페이지. 코드는 미들웨어가 쿠키(hl_m)에 남기고,
// 폼은 코드를 직접 실어 보내므로 쿠키가 막혀도 파트너 실적이 잡힌다.
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '다른 곳이 더 주면 차액의 120% 보상 | 혜택연구소',
  description: '광고 모델 없이 그 비용을 전부 고객 지원금으로. 인터넷·가전렌탈 사은품, 상담 전에 먼저 확인하세요.',
}

const SERVICES: LandingService[] = ['internet', 'electronics']

// 실제 지급 사례가 쌓이기 전까지 보여주는 예시(화면에 '예시' 표기)
const SAMPLE_CASES: GiftCase[] = [
  { name: '김*수', region: '부산 해운대구', product: 'KT 500M + TV 베이직', amount: 450000, date: '' },
  { name: '이*영', region: '창원 성산구', product: '코웨이 아이콘 정수기', amount: 200000, date: '' },
  { name: '박*호', region: '김해시', product: 'SK브로드밴드 1G + TV', amount: 520000, date: '' },
  { name: '최*린', region: '대구 수성구', product: 'LG U+ 500M', amount: 350000, date: '' },
  { name: '정*우', region: '울산 남구', product: '쿠쿠 인스퓨어 정수기', amount: 150000, date: '' },
  { name: '한*미', region: '부산 사상구', product: 'SK매직 올인원 정수기', amount: 180000, date: '' },
]

export default async function PartnerLandingPage({ params, searchParams }: { params: { code: string }; searchParams?: Record<string, string | string[] | undefined> }) {
  const code = params.code.trim().slice(0, 40)
  const db = getSupabaseAdmin()
  const { data: partner, error: partnerError } = await db.from('admin_users').select('unique_code, status').eq('unique_code', code).maybeSingle()
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

  // 가전렌탈 카탈로그: 브랜드·품목(판매 중 상품 기준)·대표 사진 3장
  const { data: prodRows } = await db
    .from('electronics_products')
    .select('brand, image_urls, display_order, electronics_categories!inner(slug, name)')
    .eq('is_active', true)
  type ProdRow = { brand: string; image_urls: string[] | null; display_order: number | null; electronics_categories: { slug: string; name: string } }
  const brandCount = new Map<string, number>()
  const catCount = new Map<string, { slug: string; name: string; count: number }>()
  const heroImages: string[] = []
  for (const r of ((prodRows ?? []) as unknown as ProdRow[]).sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999))) {
    brandCount.set(r.brand, (brandCount.get(r.brand) ?? 0) + 1)
    const c = r.electronics_categories
    if (c) {
      const cur = catCount.get(c.slug) ?? { slug: c.slug, name: c.name, count: 0 }
      cur.count += 1
      catCount.set(c.slug, cur)
    }
    if (c?.slug === 'water-purifier' && r.image_urls?.[0] && heroImages.length < 3 && !heroImages.includes(r.image_urls[0])) heroImages.push(r.image_urls[0])
  }
  const brands = [...brandCount.entries()].sort((a, b) => b[1] - a[1]).map(([b]) => b)
  const categories = [...catCount.values()].sort((a, b) => b.count - a.count).map((c) => c.name)
  const productCount = (prodRows ?? []).length

  // 지원금 지급 사례: 계약 완료 + 사은품 금액이 있는 건(이름 마스킹). 아직 없으면 예시로 채운다
  const cases: GiftCase[] = []
  for (const table of ['electronics_applications', 'internet_applications'] as const) {
    const { data } = await db.from(table).select('*').eq('status', 'contracted').gt('gift_amount', 0).order('updated_at', { ascending: false }).limit(10)
    for (const a of (data ?? []) as Record<string, unknown>[]) {
      const snap = (a.product_snapshot ?? {}) as Record<string, unknown>
      const product = [snap.brand, snap.displayName ?? snap.product ?? snap.name].filter(Boolean).join(' ') || (table === 'internet_applications' ? '인터넷+TV' : '가전렌탈')
      const addr = typeof a.address === 'string' ? a.address.split(' ').slice(0, 2).join(' ') : null
      cases.push({ name: maskName(a.applicant_name as string), region: (a.region as string) ?? addr ?? null, product, amount: Number(a.gift_amount), date: String(a.updated_at ?? a.submitted_at ?? '').slice(0, 10) })
    }
  }
  cases.sort((a, b) => b.date.localeCompare(a.date))
  const sampleCases = cases.length < 4

  // 방문 기록(파트너 홈 퍼널). 파트너 본인이 미리보기로 여는 건 제외
  const preview = Array.isArray(searchParams?.preview) ? searchParams?.preview[0] : searchParams?.preview
  if (!preview) await db.from('landing_views').insert({ marketer_code: partner.unique_code, service })

  return (
    <PartnerLanding
      code={partner.unique_code as string}
      initialService={service}
      maxGift={maxGift}
      carriers={carriers}
      catalog={{ brands, categories, heroImages, productCount }}
      cases={sampleCases ? SAMPLE_CASES : cases.slice(0, 10)}
      sampleCases={sampleCases}
    />
  )
}
