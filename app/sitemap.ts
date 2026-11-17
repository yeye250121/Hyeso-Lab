import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'
import { getCarriers } from '@/lib/internetApi'
import { getCategoryTree } from '@/lib/electronicsApi'
import { SITE_URL } from '@/lib/site'

// 검색엔진용 페이지 목록. 실제 운영 중인 인터넷·가전렌탈 페이지만 싣는다
// (카드·휴대폰은 준비 중이라 제외, 신청 폼·콘솔·파트너 랜딩도 제외).
export const revalidate = 3600

type ProductRow = { slug: string; updated_at: string | null; electronics_categories: { slug: string } }

async function getProductEntries(): Promise<MetadataRoute.Sitemap> {
  const { data, error } = await supabase
    .from('electronics_products')
    .select('slug, updated_at, electronics_categories!inner(slug)')
    .order('display_order', { ascending: true })
    .range(0, 4999)
  if (error) {
    console.error('[sitemap] product fetch failed:', error.message)
    return []
  }
  return ((data ?? []) as unknown as ProductRow[]).map((p) => ({
    // 한글 슬러그(모델명이 한글인 상품)는 퍼센트 인코딩해서 싣는다
    url: `${SITE_URL}/electronics/${encodeURIComponent(p.electronics_categories.slug)}/${encodeURIComponent(p.slug)}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [carriers, tree, products] = await Promise.all([getCarriers(), getCategoryTree(), getProductEntries()])
  const now = new Date()

  const fixed: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/internet`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/internet/recommend`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/electronics`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/electronics/category`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/apply`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/partners/register`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.1 },
  ]

  const carrierPages: MetadataRoute.Sitemap = carriers.map((c) => ({
    url: `${SITE_URL}/internet/${encodeURIComponent(c.id)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // 카테고리 페이지는 트리의 하위 노드(generateStaticParams 와 같은 기준) 중 상품이 있는 것만
  const categoryPages: MetadataRoute.Sitemap = tree
    .flatMap((group) => group.children)
    .filter((c) => c.productCount > 0)
    .map((c) => ({
      url: `${SITE_URL}/electronics/${encodeURIComponent(c.slug)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

  return [...fixed, ...carrierPages, ...categoryPages, ...products]
}
