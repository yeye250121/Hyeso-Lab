import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'benefit-lab-secret-key-2024'

export async function POST(request: NextRequest) {
  try {
    const { loginId, password, rememberMe } = await request.json()
    console.log('[Admin Login] Attempt:', loginId)

    if (!loginId || !password) {
      return NextResponse.json(
        { error: '아이디와 비밀번호를 입력해주세요' },
        { status: 400 }
      )
    }

    // 하드코딩 로그인 확인
    if (loginId !== 'siwwyy1012' || password !== 'hi1012@@') {
      return NextResponse.json(
        { error: '아이디 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 }
      )
    }

    const user = {
      id: 'hardcoded-admin-id-123',
      login_id: 'siwwyy1012',
      unique_code: 'S000000',
      nickname: '최고 관리자',
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        loginId: user.login_id,
        uniqueCode: user.unique_code,
        isAdmin: true,
      },
      JWT_SECRET,
      { expiresIn: rememberMe ? '30d' : '1d' }
    )

    const response = NextResponse.json({
      token,
      admin: {
        id: user.id,
        loginId: user.login_id,
        uniqueCode: user.unique_code,
        nickname: user.nickname,
      },
    })

    // 쿠키에 토큰 저장 (미들웨어에서 인증 체크용)
    // rememberMe: 체크 시 30일, 미체크 시 세션 쿠키 (브라우저 종료 시 삭제)
    const cookieOptions: {
      httpOnly: boolean
      secure: boolean
      sameSite: 'lax'
      path: string
      maxAge?: number
    } = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    }

    if (rememberMe) {
      cookieOptions.maxAge = 60 * 60 * 24 * 30 // 30일
    }

    response.cookies.set('admin-token', token, cookieOptions)

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
