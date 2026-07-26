import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import {
  requireAdmin,
  routeError,
  unauthorizedResponse,
} from '@/lib/admin/route'

const PRIVATE_BUCKET = 'benefit-lab-private'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!requireAdmin(request)) return unauthorizedResponse()

  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { data: settlement, error: findError } = await supabaseAdmin
      .from('settlements')
      .select('id, file_path')
      .eq('id', params.id)
      .maybeSingle()
    if (findError) throw findError
    if (!settlement) {
      return NextResponse.json({ error: '정산서를 찾을 수 없습니다.' }, { status: 404 })
    }

    const { error: deleteError } = await supabaseAdmin
      .from('settlements')
      .delete()
      .eq('id', settlement.id)
    if (deleteError) throw deleteError

    const { error: storageError } = await supabaseAdmin.storage
      .from(PRIVATE_BUCKET)
      .remove([settlement.file_path])
    if (storageError) {
      console.error('[Admin Settlement Storage Delete]', storageError)
    }

    return NextResponse.json({ message: '정산서가 삭제되었습니다.' })
  } catch (error) {
    return routeError('Admin Settlement Delete', error, '정산서를 삭제하지 못했습니다.')
  }
}
