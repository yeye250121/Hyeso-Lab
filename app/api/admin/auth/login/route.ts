import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/admin/auth';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { loginId, password, rememberMe } = await req.json();

    if (!loginId || !password) {
      return NextResponse.json({ error: '아이디와 비밀번호를 입력해주세요.' }, { status: 400 });
    }

    const { data: user, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('login_id', loginId)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: '아이디 또는 비밀번호가 일치하지 않습니다.' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: '아이디 또는 비밀번호가 일치하지 않습니다.' }, { status: 401 });
    }

    const adminContext = {
      id: user.id,
      loginId: user.login_id,
      uniqueCode: user.unique_code,
      nickname: user.nickname,
    };

    const token = generateToken(adminContext);

    // Set cookie
    cookies().set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 24, // 7 days or 1 day
    });

    return NextResponse.json({
      message: '로그인 성공',
      token,
      admin: adminContext
    });

  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: '로그인 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
