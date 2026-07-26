import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin/auth'

export function requireAdmin(request: NextRequest) {
  return getAdminContext(request)
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
}

export function routeError(
  scope: string,
  error: unknown,
  fallbackMessage: string
) {
  console.error(`[${scope}]`, error)

  const message = error instanceof Error ? error.message : ''
  const isConfigurationError =
    message.includes('SUPABASE_SERVICE_ROLE_KEY') ||
    message.includes('JWT_SECRET')

  return NextResponse.json(
    {
      error: isConfigurationError
        ? '서버 인증 환경변수가 설정되지 않았습니다.'
        : fallbackMessage,
    },
    { status: isConfigurationError ? 503 : 500 }
  )
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
