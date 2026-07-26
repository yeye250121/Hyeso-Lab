import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export interface UserContext {
  id: string
  loginId: string
  uniqueCode: string
  nickname: string
  level: number
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.')
  }
  return secret
}

/**
 * JWT 토큰에서 사용자 정보 추출
 */
export function getUserContext(request: NextRequest): UserContext | null {
  const authHeader = request.headers.get('authorization')
  const cookieToken = request.cookies.get('partner-token')?.value

  if (!cookieToken && (!authHeader || !authHeader.startsWith('Bearer '))) {
    return null
  }

  const token = cookieToken || authHeader!.substring(7)

  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ['HS256'],
    }) as UserContext

    if (!decoded?.uniqueCode || typeof decoded.uniqueCode !== 'string') {
      return null
    }

    return {
      id: decoded.id,
      loginId: decoded.loginId,
      uniqueCode: decoded.uniqueCode,
      nickname: decoded.nickname,
      level: decoded.level,
    }
  } catch (error) {
    console.error('[Auth] 토큰 검증 실패:', error)
    return null
  }
}

/**
 * JWT 토큰 생성
 * @param user 사용자 정보
 * @param rememberMe 로그인 상태 유지 여부 (true: 30일, false: 1일)
 */
export function generateToken(user: UserContext, rememberMe: boolean = false): string {
  return jwt.sign(
    {
      id: user.id,
      loginId: user.loginId,
      uniqueCode: user.uniqueCode,
      nickname: user.nickname,
      level: user.level,
    },
    getJwtSecret(),
    {
      algorithm: 'HS256',
      expiresIn: rememberMe ? '30d' : '1d',
    }
  )
}
