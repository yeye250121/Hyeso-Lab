import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'
import { ALL_ROLES } from '@/lib/admin/auth'
import { TREE_COLUMNS, nextSortOrder, toNode } from '@/lib/admin/library'

// 라이브러리 트리(제목만). 외부 마케터에게는 발행된 문서만 보인다.
export async function GET(request: NextRequest) {
  const admin = requireAdmin(request, ALL_ROLES)
  if (!admin) return unauthorizedResponse()
  try {
    let q = getSupabaseAdmin().from('library_docs').select(TREE_COLUMNS).order('sort_order').order('created_at')
    if (admin.role === 'marketer') q = q.eq('is_published', true)
    const { data, error } = await q
    if (error) throw error
    return NextResponse.json({ docs: (data ?? []).map(toNode), canEdit: admin.role !== 'marketer' })
  } catch (error) {
    return routeError('Admin Library', error, '라이브러리를 불러오지 못했습니다.')
  }
}

const createSchema = z.object({
  parentId: z.string().uuid().nullable().optional(),
  title: z.string().trim().max(200).optional(),
})

// 새 문서. 운영진만.
export async function POST(request: NextRequest) {
  const admin = requireAdmin(request)
  if (!admin) return unauthorizedResponse()
  const parsed = createSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: '올바르지 않은 값입니다.' }, { status: 400 })
  try {
    const parentId = parsed.data.parentId ?? null
    const { data, error } = await getSupabaseAdmin()
      .from('library_docs')
      .insert({
        parent_id: parentId,
        title: parsed.data.title || '제목 없음',
        sort_order: await nextSortOrder(parentId),
        created_by: admin.id,
        updated_by: admin.id,
      })
      .select(TREE_COLUMNS)
      .single()
    if (error) throw error
    return NextResponse.json({ doc: toNode(data) }, { status: 201 })
  } catch (error) {
    return routeError('Admin Library Create', error, '문서를 만들지 못했습니다.')
  }
}
