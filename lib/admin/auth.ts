import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export interface AdminContext {
  id: string
  loginId: string
  uniqueCode: string
  nickname: string
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32 || secret.startsWith('replace-')) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.')
  }
  return secret
}

export function verifyAdminToken(token: string): AdminContext | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ['HS256'],
    }) as jwt.JwtPayload

    if (
      typeof decoded.id !== 'string' ||
      typeof decoded.loginId !== 'string' ||
      typeof decoded.uniqueCode !== 'string' ||
      !decoded.uniqueCode.startsWith('S')
    ) {
      return null
    }

    return {
      id: decoded.id,
      loginId: decoded.loginId,
      uniqueCode: decoded.uniqueCode,
      nickname: typeof decoded.nickname === 'string' ? decoded.nickname : '',
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('JWT_SECRET')) {
      console.error('[Admin Auth] 서버 인증 설정 오류:', error.message)
    }
    return null
  }
}

export function getAdminContext(request: NextRequest): AdminContext | null {
  const cookieToken = request.cookies.get('admin-token')?.value
  const authHeader = request.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : undefined
  const token = cookieToken || bearerToken

  return token ? verifyAdminToken(token) : null
}

/**
 * JWT 토큰 생성
 */
export function generateToken(
  user: AdminContext,
  rememberMe: boolean = false
): string {
  return jwt.sign(
    {
      id: user.id,
      loginId: user.loginId,
      uniqueCode: user.uniqueCode,
      nickname: user.nickname,
    },
    getJwtSecret(),
    {
      algorithm: 'HS256',
      expiresIn: rememberMe ? '7d' : '1d',
    }
  )
}

/**
 * 관리자 인증 확인 (API용)
 */
export async function verifyAdminAuth(request: NextRequest): Promise<AdminContext | null> {
  return getAdminContext(request)
}
