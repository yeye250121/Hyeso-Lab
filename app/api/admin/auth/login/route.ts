import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'piooom-secret-key-2024'

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

    // Find user by loginId
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('login_id', loginId)
      .single()

    console.log('[Admin Login] User query result:', { user: user?.login_id, error })

    if (error || !user) {
      console.log('[Admin Login] User not found or error')
      return NextResponse.json(
        { error: '아이디 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 }
      )
    }

    // Check if user is admin (S code)
    if (!user.unique_code.startsWith('S')) {
      return NextResponse.json(
        { error: '관리자 권한이 없습니다' },
        { status: 403 }
      )
    }

    // Verify password
    console.log('[Admin Login] Verifying password, hash exists:', !!user.password_hash)
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    console.log('[Admin Login] Password valid:', isValidPassword)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: '아이디 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 }
      )
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
