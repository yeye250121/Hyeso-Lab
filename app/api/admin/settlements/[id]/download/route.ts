import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import {
  requireAdmin,
  routeError,
  unauthorizedResponse,
} from '@/lib/admin/route'

export const runtime = 'nodejs'

const PRIVATE_BUCKET = 'benefit-lab-private'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!requireAdmin(request)) return unauthorizedResponse()

  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { data: settlement, error: findError } = await supabaseAdmin
      .from('settlements')
      .select('file_name, file_path, content_type')
      .eq('id', params.id)
      .maybeSingle()
    if (findError) throw findError
    if (!settlement) {
      return NextResponse.json({ error: '정산서를 찾을 수 없습니다.' }, { status: 404 })
    }

    const { data: file, error: downloadError } = await supabaseAdmin.storage
      .from(PRIVATE_BUCKET)
      .download(settlement.file_path)
    if (downloadError) throw downloadError

    return new NextResponse(await file.arrayBuffer(), {
      headers: {
        'Content-Type': settlement.content_type,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(settlement.file_name)}`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    return routeError('Admin Settlement Download', error, '정산서를 다운로드하지 못했습니다.')
  }
}
