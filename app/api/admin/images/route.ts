import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'
import { ALL_ROLES } from '@/lib/admin/auth'
import { getAllProducts } from '@/lib/electronicsApi'

// 이미지 센터. 마케터가 블로그 글에 쓸 렌탈 상품 사진 목록(공개 카탈로그 데이터).
export async function GET(request: NextRequest) {
  const admin = requireAdmin(request, ALL_ROLES)
  if (!admin) return unauthorizedResponse()
  try {
    const products = await getAllProducts()
    const items = products
      .filter((p) => p.image_urls?.length)
      .map((p) => ({ id: p.id, slug: p.slug, brand: p.brand, name: p.display_name, category: p.category_name, categorySlug: p.category_slug, image: p.image_urls[0], minFee: p.minFee }))
    const categories = [...new Map(items.map((i) => [i.categorySlug, i.category])).entries()].map(([slug, name]) => ({ slug, name, count: items.filter((i) => i.categorySlug === slug).length }))
    return NextResponse.json({ items, categories })
  } catch (error) {
    return routeError('Admin Images', error, '이미지를 불러오지 못했습니다.')
  }
}
