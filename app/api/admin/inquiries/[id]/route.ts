import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import {
  requireAdmin,
  routeError,
  unauthorizedResponse,
} from '@/lib/admin/route'

const updateSchema = z.object({
  status: z.enum(['new', 'in_progress', 'contracted', 'cancelled']),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!requireAdmin(request)) return unauthorizedResponse()

  const parsed = updateSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: '올바르지 않은 상태값입니다.' }, { status: 400 })
  }

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('inquiries')
      .update({ status: parsed.data.status })
      .eq('id', params.id)
      .select('id')
      .maybeSingle()
    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: '문의를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ message: '상태가 변경되었습니다.' })
  } catch (error) {
    return routeError('Admin Inquiry Update', error, '문의 상태를 변경하지 못했습니다.')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!requireAdmin(request)) return unauthorizedResponse()

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('inquiries')
      .delete()
      .eq('id', params.id)
      .select('id')
      .maybeSingle()
    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: '문의를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ message: '문의가 삭제되었습니다.' })
  } catch (error) {
    return routeError('Admin Inquiry Delete', error, '문의를 삭제하지 못했습니다.')
  }
}
