import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'

// 렌탈 상품 목록(관리용). 판매 중지된 상품도 포함한다.
export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return unauthorizedResponse()

  try {
    const db = getSupabaseAdmin()
    const [products, categories] = await Promise.all([
      db
        .from('electronics_products')
        .select('id, slug, brand, model_code, display_name, image_urls, is_active, category_id, display_order')
        .order('display_order', { ascending: true }),
      db.from('electronics_categories').select('id, slug, name, parent_id'),
    ])
    const error = products.error || categories.error
    if (error) throw error

    const catById = Object.fromEntries((categories.data ?? []).map((c) => [c.id, c]))

    // 월 최저가. PostgREST 는 한 번에 1000행까지만 주므로 요약 뷰를 끝까지 넘겨가며 읽는다.
    // 실패해도 목록 자체는 보여준다.
    const minFee: Record<string, number> = {}
    const PAGE = 1000
    for (let from = 0; from < 30000; from += PAGE) {
      const { data: rows, error: planError } = await db
        .from('electronics_plan_summary')
        .select('product_id, monthly_fee')
        .order('product_id')
        .range(from, from + PAGE - 1)
      if (planError || !rows) break
      for (const row of rows) {
        const cur = minFee[row.product_id]
        if (cur === undefined || row.monthly_fee < cur) minFee[row.product_id] = row.monthly_fee
      }
      if (rows.length < PAGE) break
    }

    return NextResponse.json({
      categories: (categories.data ?? []).filter((c) => c.parent_id).map((c) => ({ slug: c.slug, name: c.name })),
      products: (products.data ?? []).map((p) => ({
        id: p.id,
        slug: p.slug,
        brand: p.brand,
        modelCode: p.model_code,
        name: p.display_name,
        image: p.image_urls?.[0] ?? null,
        isActive: p.is_active,
        categorySlug: catById[p.category_id]?.slug ?? null,
        categoryName: catById[p.category_id]?.name ?? null,
        minFee: minFee[p.id] ?? null,
      })),
    })
  } catch (error) {
    return routeError('Admin Rental Products', error, '상품 목록을 불러오지 못했습니다.')
  }
}
