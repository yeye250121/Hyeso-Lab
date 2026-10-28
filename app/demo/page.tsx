import { getSupabaseAdmin } from '@/lib/supabase-admin'
import DemoHome, { type DemoData } from '@/components/demo/DemoHome'

// 메인 홈 데모. 기존 메인(/)은 건드리지 않고 /demo 에서만 보인다.
// 숫자·사진·사은품은 전부 실데이터(정책표·상품 DB)에서 가져온다.
export const revalidate = 600

export const metadata = {
  title: '혜택연구소 — 놓치고 있던 혜택, 대신 알아볼게요',
  description: '인터넷·가전렌탈·카드 혜택을 한 곳에서 비교하고, 다른 곳이 더 주면 차액의 120%를 보상해요.',
  robots: { index: false },
}

// 대표 상품(배지 없는 깨끗한 사진)
const FEATURED = ['kyowon-wells-ws674', 'coway-chp-5730r', 'lg-wd723r-k-e', 'coway-ap-1125g', 'sk-magic-acl131t0cjdg', 'coway-bas47-ae-ar', 'cuckoo-cbt-qs1041rw', 'coway-apm-1226h']

export default async function DemoPage() {
  const db = getSupabaseAdmin()
  const [carriersRes, giftsRes, prodRes, countRes] = await Promise.all([
    db.from('internet_carriers').select('name, logo_url, business_only, display_order').eq('is_active', true).order('display_order'),
    db.from('internet_products').select('customer_gift, voucher, internet_carriers!inner(name, business_only)').eq('is_active', true),
    db.from('electronics_products').select('slug, brand, display_name, image_urls, electronics_categories!inner(name, slug)').in('slug', FEATURED),
    db.from('electronics_products').select('brand', { count: 'exact', head: false }).eq('is_active', true),
  ])

  type GiftRow = { customer_gift: number | null; voucher: number | null; internet_carriers: { name: string; business_only: boolean | null } }
  const giftByCarrier = new Map<string, number>()
  for (const g of (giftsRes.data ?? []) as unknown as GiftRow[]) {
    if (!g.internet_carriers || g.internet_carriers.business_only || !g.customer_gift) continue
    giftByCarrier.set(g.internet_carriers.name, Math.max(giftByCarrier.get(g.internet_carriers.name) ?? 0, g.customer_gift + (g.voucher ?? 0)))
  }
  const carriers = (carriersRes.data ?? [])
    .filter((c) => !c.business_only)
    .map((c) => ({ name: c.name as string, logo: c.logo_url as string, gift: giftByCarrier.get(c.name as string) ?? 0 }))
  const maxGift = carriers.reduce((m, c) => Math.max(m, c.gift), 0)

  // 월 최저가는 요약 뷰에서
  const slugs = FEATURED
  const prods = (prodRes.data ?? []) as unknown as { slug: string; brand: string; display_name: string; image_urls: string[] | null; electronics_categories: { name: string; slug: string } }[]
  const ids = await db.from('electronics_products').select('id, slug').in('slug', slugs)
  const idBySlug = new Map((ids.data ?? []).map((r) => [r.slug as string, r.id as string]))
  const fees = await db.from('electronics_plan_summary').select('product_id, monthly_fee').in('product_id', [...idBySlug.values()])
  const minFee = new Map<string, number>()
  for (const f of fees.data ?? []) minFee.set(f.product_id as string, Math.min(minFee.get(f.product_id as string) ?? Infinity, f.monthly_fee as number))
  const products = slugs
    .map((s) => prods.find((p) => p.slug === s))
    .filter((p): p is NonNullable<typeof p> => !!p && !!p.image_urls?.[0])
    .map((p) => ({ slug: p.slug, brand: p.brand, name: p.display_name, image: p.image_urls![0], category: p.electronics_categories?.name ?? '', categorySlug: p.electronics_categories?.slug ?? '', fee: minFee.get(idBySlug.get(p.slug) ?? '') ?? null }))

  const brandCount = new Map<string, number>()
  for (const r of countRes.data ?? []) brandCount.set(r.brand as string, (brandCount.get(r.brand as string) ?? 0) + 1)
  const brands = [...brandCount.entries()].sort((a, b) => b[1] - a[1]).map(([b]) => b)

  const data: DemoData = { carriers, maxGift, products, productCount: countRes.count ?? countRes.data?.length ?? 0, brands }
  return <DemoHome data={data} />
}
