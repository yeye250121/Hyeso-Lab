import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext, STAFF_ROLES, type AdminRole } from '@/lib/admin/auth'

/**
 * 로그인한 구성원 중 허용 역할만 통과시킨다. 기본은 운영진(owner·admin)이라
 * 기존 관리자 API 는 그대로 두면 외부 마케터가 들어올 수 없다.
 * 라이브러리·프로필·채팅처럼 전원이 쓰는 API 는 ALL_ROLES 를 넘긴다.
 */
export function requireAdmin(request: NextRequest, roles: AdminRole[] = STAFF_ROLES) {
  const ctx = getAdminContext(request)
  if (!ctx || !roles.includes(ctx.role)) return null
  return ctx
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
