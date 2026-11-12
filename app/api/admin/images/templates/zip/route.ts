import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'
import { ALL_ROLES } from '@/lib/admin/auth'
import { downloadTemplateFile, getTemplate } from '@/lib/admin/templates'
import { buildZip } from '@/lib/admin/zip'

export const runtime = 'nodejs'

// 템플릿 묶음을 ZIP 하나로. 원본 바이트 무압축 저장이라 해상도가 그대로이고, 파일명도 원래 한글 이름 그대로다.
export async function GET(request: NextRequest) {
  if (!requireAdmin(request, ALL_ROLES)) return unauthorizedResponse()
  const id = request.nextUrl.searchParams.get('id') ?? ''
  try {
    const t = await getTemplate(id)
    if (!t) return NextResponse.json({ error: '템플릿이 없습니다.' }, { status: 404 })
    const entries = await Promise.all(t.files.map(async (f) => ({ name: `${t.name}/${f.name}`, data: await downloadTemplateFile(f.key) })))
    const zip = buildZip(entries)
    const filename = `${t.name}.zip`
    return new NextResponse(new Blob([zip]), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Length': String(zip.length),
        // ASCII 폴백 + RFC 5987 UTF-8 이름
        'Content-Disposition': `attachment; filename="template.zip"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    return routeError('Admin Template Zip', error, 'ZIP 을 만들지 못했습니다.')
  }
}
