import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { loginId, password, nickname, inviteKey } = await req.json();

    if (!loginId || !password || !nickname || !inviteKey) {
      return NextResponse.json({ error: '모든 필드를 입력해주세요.' }, { status: 400 });
    }

    // 1. Verify invite key
    const { data: keyData, error: keyError } = await supabaseAdmin
      .from('admin_invite_keys')
      .select('*')
      .eq('key', inviteKey)
      .single();

    if (keyError || !keyData) {
      return NextResponse.json({ error: '유효하지 않은 인증 키입니다.' }, { status: 400 });
    }

    if (keyData.is_used) {
      return NextResponse.json({ error: '이미 사용된 인증 키입니다.' }, { status: 400 });
    }

    if (new Date(keyData.expires_at) < new Date()) {
      return NextResponse.json({ error: '만료된 인증 키입니다.' }, { status: 400 });
    }

    // 2. Check if loginId exists
    const { data: existingUser } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('login_id', loginId)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: '이미 존재하는 아이디입니다.' }, { status: 400 });
    }

    // 3. Hash password and insert user
    const passwordHash = await bcrypt.hash(password, 10);
    const uniqueCode = `S-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('admin_users')
      .insert({
        login_id: loginId,
        password_hash: passwordHash,
        unique_code: uniqueCode,
        nickname: nickname
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // 4. Mark key as used
    await supabaseAdmin
      .from('admin_invite_keys')
      .update({ is_used: true })
      .eq('key', inviteKey);

    return NextResponse.json({
      message: '회원가입 성공',
      user: {
        loginId: newUser.login_id,
        nickname: newUser.nickname
      }
    });

  } catch (error) {
    console.error('Register Error:', error);
    return NextResponse.json({ error: '회원가입 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
