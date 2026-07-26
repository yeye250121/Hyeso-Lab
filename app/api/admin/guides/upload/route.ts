import { NextRequest, NextResponse } from 'next/server'
import { uploadPublicImage } from '@/lib/admin/upload'
import {
  requireAdmin,
  routeError,
  unauthorizedResponse,
} from '@/lib/admin/route'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) return unauthorizedResponse()

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: '이미지 파일이 필요합니다.' }, { status: 400 })
    }

    const url = await uploadPublicImage(file, 'admin/guides')
    return NextResponse.json({ url }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('업로드할 수 있습니다')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return routeError('Admin Guide Upload', error, '이미지를 업로드하지 못했습니다.')
  }
}
