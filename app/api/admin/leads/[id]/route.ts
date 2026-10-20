import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'
import { notifyPartnerForLead } from '@/lib/alimtalk-service'

const updateSchema = z
  .object({
    status: z.enum(['new', 'contacted', 'applied', 'closed']).optional(),
    memo: z.string().max(2000).optional(),
  })
  .refine((v) => v.status !== undefined || v.memo !== undefined, '변경할 값이 없습니다.')

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!requireAdmin(request)) return unauthorizedResponse()

  const parsed = updateSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: '올바르지 않은 값입니다.' }, { status: 400 })
  }

  try {
    const patch: Record<string, unknown> = {}
    if (parsed.data.status !== undefined) patch.status = parsed.data.status
    if (parsed.data.memo !== undefined) patch.admin_memo = parsed.data.memo.trim() || null

    const db = getSupabaseAdmin()
    const { data: before } = await db.from('leads').select('status').eq('id', params.id).maybeSingle()
    const { data, error } = await db
      .from('leads')
      .update(patch)
      .eq('id', params.id)
      .select('id')
      .maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: '상담 신청을 찾을 수 없습니다.' }, { status: 404 })

    // 종료(미계약)로 바뀌면 연결된 파트너에게 취소 안내
    if (parsed.data.status === 'closed' && before?.status !== 'closed') await notifyPartnerForLead(params.id, 'cancelled')

    return NextResponse.json({ ok: true })
  } catch (error) {
    return routeError('Admin Lead Update', error, '상담 신청을 수정하지 못했습니다.')
  }
}
