import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'
import { ALL_ROLES } from '@/lib/admin/auth'
import { maskName } from '@/lib/admin/mask'
import { getCategoryTree } from '@/lib/electronicsApi'

// 마케터의 내 상담 목록. 이름은 가운데 마스킹, 전화번호·주소·상품 상세는 내려주지 않는다.
export async function GET(request: NextRequest) {
  const admin = requireAdmin(request, ALL_ROLES)
  if (!admin) return unauthorizedResponse()
  const status = request.nextUrl.searchParams.get('status')
  try {
    let q = getSupabaseAdmin()
      .from('leads')
      .select('id, service, status, applicant_name, product_snapshot, application_id, submitted_at')
      .eq('marketer_code', admin.uniqueCode)
      .order('submitted_at', { ascending: false })
      .limit(500)
    if (status) q = q.eq('status', status)
    const [{ data, error }, tree] = await Promise.all([q, getCategoryTree()])
    if (error) throw error
    const categoryName = new Map(tree.flatMap((g) => g.children).map((c) => [c.slug, c.name]))
    return NextResponse.json({
      leads: (data ?? []).map((l) => {
        const snap = (l.product_snapshot ?? {}) as Record<string, unknown>
        return {
          id: l.id,
          service: l.service,
          status: l.status,
          name: maskName(l.applicant_name),
          // 상품은 카테고리 수준까지만
          product: snap.categorySlug ? categoryName.get(String(snap.categorySlug)) ?? String(snap.categorySlug) : null,
          hasApplication: !!l.application_id,
          submittedAt: l.submitted_at,
        }
      }),
    })
  } catch (error) {
    return routeError('Marketer Leads', error, '상담 목록을 불러오지 못했습니다.')
  }
}
