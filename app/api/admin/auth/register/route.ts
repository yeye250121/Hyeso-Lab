import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  loginId: z.string().trim().min(4).max(50).regex(/^[a-zA-Z0-9._-]+$/),
  password: z.string().min(10).max(200),
  nickname: z.string().trim().min(1).max(50),
  inviteKey: z.string().trim().min(1).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = registerSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값을 확인해주세요. 비밀번호는 10자 이상이어야 합니다.' },
        { status: 400 }
      );
    }
    const { loginId, password, nickname, inviteKey } = parsed.data;
    const supabaseAdmin = getSupabaseAdmin();
    const passwordHash = await bcrypt.hash(password, 10);
    const { data, error } = await supabaseAdmin.rpc('register_admin_with_invite', {
      p_invite_key: inviteKey,
      p_login_id: loginId,
      p_password_hash: passwordHash,
      p_nickname: nickname,
    });

    if (error || !data?.[0]) {
      const duplicateLogin = error?.code === '23505';
      return NextResponse.json(
        {
          error: duplicateLogin
            ? '이미 존재하는 아이디입니다.'
            : '유효하지 않거나 만료된 인증 키입니다.',
        },
        { status: 400 }
      );
    }
    const newUser = data[0];

    return NextResponse.json({
      message: '회원가입 성공',
      user: {
        loginId: newUser.user_login_id,
        nickname: newUser.user_nickname
      }
    });

  } catch (error) {
    console.error('Register Error:', error);
    return NextResponse.json({ error: '회원가입 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
