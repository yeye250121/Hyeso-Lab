import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { issueResetToken, overLimit } from '@/lib/admin/password-reset'
import { sendPasswordResetAlimtalk } from '@/lib/alimtalk-service'

// 비밀번호 찾기: 아이디 + 가입 때 적은 휴대폰 번호. 둘이 맞는 활성 계정이면 그 번호로 재설정 링크를 보낸다.
// 계정이 있든 없든, 번호가 틀리든, 요청이 과다하든 응답은 같다(계정 존재 노출 방지).
const schema = z.object({
  loginId: z.string().trim().min(1).max(50),
  phone: z.string().trim().min(10).max(20),
})

const OK = { ok: true, message: '아이디와 휴대폰 번호가 맞으면 재설정 링크를 카카오톡(미수신 시 문자)으로 보냈어요.' }

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: '아이디와 휴대폰 번호를 입력해 주세요.' }, { status: 400 })
  const phone = parsed.data.phone.replace(/\D/g, '')
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null

  try {
    const { data: user } = await getSupabaseAdmin()
      .from('admin_users')
      .select('id, nickname, phone, status')
      .eq('login_id', parsed.data.loginId)
      .maybeSingle()
    const match = user && user.status === 'active' && typeof user.phone === 'string' && user.phone.replace(/\D/g, '') === phone
    if (await overLimit(match ? (user.id as string) : null, ip)) {
      console.warn(`[PasswordReset] 요청 과다: login=${parsed.data.loginId} ip=${ip}`)
      return NextResponse.json(OK)
    }
    if (!match) {
      console.info(`[PasswordReset] 불일치 요청: login=${parsed.data.loginId}`)
      return NextResponse.json(OK)
    }
    const token = await issueResetToken(user.id as string, ip)
    const sent = await sendPasswordResetAlimtalk(user.phone as string, (user.nickname as string) || '회원', token)
    console.info(`[PasswordReset] 링크 발송: user=${user.id} success=${sent.success}${sent.error ? ` (${sent.error})` : ''}`)
    return NextResponse.json(OK)
  } catch (error) {
    console.error('[PasswordReset] 요청 처리 실패:', error)
    return NextResponse.json(OK)
  }
}
