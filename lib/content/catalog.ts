import { getSupabaseAdmin } from '@/lib/supabase-admin'
import type { GiftCase } from '@/components/landing/PartnerLanding'
import { maskName } from '@/lib/admin/mask'
import { MANUAL_GIFT_CASES } from './giftCases'

// 메인에 쓰는 실데이터: 통신사·최대 지원금·렌탈 상품 수·브랜드·실제 지급 사례.
export type HomeCatalog = { carriers: string[]; maxGift: number; productCount: number; brands: string[]; cases: GiftCase[] }

export async function getHomeCatalog(): Promise<HomeCatalog> {
  const db = getSupabaseAdmin()
  const [carriersRes, giftsRes, prodRes, ea, ia] = await Promise.all([
    db.from('internet_carriers').select('name, business_only, display_order').eq('is_active', true).order('display_order'),
    db.from('internet_products').select('customer_gift, voucher, internet_carriers!inner(business_only)').eq('is_active', true),
    db.from('electronics_products').select('brand').eq('is_active', true),
    db.from('electronics_applications').select('applicant_name, region, product_snapshot, gift_amount, updated_at').eq('status', 'contracted').gt('gift_amount', 0).order('updated_at', { ascending: false }).limit(10),
    db.from('internet_applications').select('applicant_name, region, product_snapshot, gift_amount, updated_at').eq('status', 'contracted').gt('gift_amount', 0).order('updated_at', { ascending: false }).limit(10),
  ])
  type G = { customer_gift: number | null; voucher: number | null; internet_carriers: { business_only: boolean | null } }
  let maxGift = 0
  for (const g of (giftsRes.data ?? []) as unknown as G[]) if (!g.internet_carriers?.business_only && g.customer_gift) maxGift = Math.max(maxGift, g.customer_gift + (g.voucher ?? 0))
  const carriers = (carriersRes.data ?? []).filter((c) => !c.business_only).map((c) => c.name as string)
  const brandCount = new Map<string, number>()
  for (const r of prodRes.data ?? []) brandCount.set(r.brand as string, (brandCount.get(r.brand as string) ?? 0) + 1)
  const brands = [...brandCount.entries()].sort((a, b) => b[1] - a[1]).map(([b]) => b)
  const toCase = (a: Record<string, unknown>, fallback: string): GiftCase => {
    const snap = (a.product_snapshot ?? {}) as Record<string, unknown>
    return { name: maskName(a.applicant_name as string), region: (a.region as string) ?? null, product: [snap.brand, snap.displayName ?? snap.product].filter(Boolean).join(' ') || fallback, amount: Number(a.gift_amount), date: String(a.updated_at ?? '').slice(0, 10) }
  }
  const cases = [...MANUAL_GIFT_CASES, ...(ea.data ?? []).map((a) => toCase(a, '가전렌탈')), ...(ia.data ?? []).map((a) => toCase(a, '인터넷+TV'))].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12)
  return { carriers, maxGift, productCount: prodRes.data?.length ?? 0, brands, cases }
}
