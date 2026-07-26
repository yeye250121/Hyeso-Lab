import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import {
  requireAdmin,
  routeError,
  unauthorizedResponse,
} from '@/lib/admin/route'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!requireAdmin(request)) return unauthorizedResponse()

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('partners')
      .delete()
      .eq('id', params.id)
      .select('id')
      .maybeSingle()
    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: '파트너를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ message: '파트너가 삭제되었습니다.' })
  } catch (error) {
    return routeError('Admin Partner Delete', error, '파트너를 삭제하지 못했습니다.')
  }
}
