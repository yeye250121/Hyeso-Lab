import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'piooom-secret-key-2024'

export interface AdminContext {
  id: string
  loginId: string
  uniqueCode: string
  nickname: string
}

/**
 * 관리자(S코드) 인증 확인
 */
export function getAdminContext(request: NextRequest): AdminContext | null {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any

    if (!decoded?.uniqueCode || typeof decoded.uniqueCode !== 'string') {
      return null
    }

    // S코드 확인 (관리자만)
    if (!decoded.uniqueCode.startsWith('S')) {
      return null
    }

    return {
      id: decoded.id,
      loginId: decoded.loginId,
      uniqueCode: decoded.uniqueCode,
      nickname: decoded.nickname || '',
    }
  } catch (error) {
    console.error('[Admin Auth] 토큰 검증 실패:', error)
    return null
  }
}

/**
 * JWT 토큰 생성
 */
export function generateToken(user: AdminContext): string {
  return jwt.sign(
    {
      id: user.id,
      loginId: user.loginId,
      uniqueCode: user.uniqueCode,
      nickname: user.nickname,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

/**
 * 관리자 인증 확인 (API용)
 */
export async function verifyAdminAuth(request: NextRequest): Promise<AdminContext | null> {
  return getAdminContext(request)
}
