import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { ELECTRONICS_CACHE_TAG } from '@/lib/electronicsApi'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'

const updateSchema = z.object({ isActive: z.boolean() })

// 판매 중지/재개. 행을 지우지 않고 is_active 만 바꾼다(신청 기록이 상품을 참조한다).
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!requireAdmin(request)) return unauthorizedResponse()

  const parsed = updateSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: '올바르지 않은 값입니다.' }, { status: 400 })

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('electronics_products')
      .update({ is_active: parsed.data.isActive })
      .eq('id', params.id)
      .select('id')
      .maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: '상품을 찾을 수 없습니다.' }, { status: 404 })

    revalidateTag(ELECTRONICS_CACHE_TAG)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return routeError('Admin Rental Product Update', error, '상품을 수정하지 못했습니다.')
  }
}
