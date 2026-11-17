import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { findLiveReset } from '@/lib/admin/password-reset'

// 재설정 링크 검증(GET)과 새 비밀번호 저장(POST). 토큰은 한 번 쓰면 끝이고, 같은 계정의 다른 토큰도 함께 닫는다.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') ?? ''
  const row = await findLiveReset(token).catch(() => null)
  return NextResponse.json({ valid: Boolean(row) })
}

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, '비밀번호는 8자 이상으로 입력해 주세요.').max(72),
})

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? '입력값을 확인해 주세요.' }, { status: 400 })
  try {
    const row = await findLiveReset(parsed.data.token)
    if (!row) return NextResponse.json({ error: '링크가 만료됐거나 이미 사용됐어요. 비밀번호 찾기를 다시 해주세요.' }, { status: 410 })
    const db = getSupabaseAdmin()
    const now = new Date().toISOString()
    const { error } = await db.from('admin_users').update({ password_hash: await bcrypt.hash(parsed.data.password, 10) }).eq('id', row.admin_user_id)
    if (error) throw error
    await db.from('password_resets').update({ used_at: now }).eq('admin_user_id', row.admin_user_id).is('used_at', null)
    console.info(`[PasswordReset] 비밀번호 변경 완료: user=${row.admin_user_id}`)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[PasswordReset] 변경 실패:', error)
    return NextResponse.json({ error: '비밀번호를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
  }
}
