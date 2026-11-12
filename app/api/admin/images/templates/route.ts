import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'
import { ALL_ROLES } from '@/lib/admin/auth'
import { listTemplates } from '@/lib/admin/templates'

// 이미지 센터 템플릿 목록. 전 구성원 열람.
export async function GET(request: NextRequest) {
  if (!requireAdmin(request, ALL_ROLES)) return unauthorizedResponse()
  try {
    return NextResponse.json({ templates: await listTemplates() })
  } catch (error) {
    return routeError('Admin Templates', error, '템플릿을 불러오지 못했습니다.')
  }
}
