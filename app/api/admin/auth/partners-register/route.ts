import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { sendPartnerSignupAlimtalk } from '@/lib/alimtalk-service'

// 파트너스 가입 신청(공개). 초대키 없이 신청하면 승인 대기(pending)로 들어가고, 대표자가 승인해야 로그인된다.
const schema = z.object({
  loginId: z.string().trim().min(4).max(50).regex(/^[a-zA-Z0-9._-]+$/, '아이디는 영문·숫자·._- 만 쓸 수 있어요.'),
  password: z.string().min(10, '비밀번호는 10자 이상이어야 해요.').max(200),
  nickname: z.string().trim().min(1, '이름을 입력해 주세요.').max(50),
  phone: z.string().regex(/^01[016789]-\d{3,4}-\d{4}$/, '휴대폰 번호를 정확히 입력해 주세요.'),
  bankName: z.string().trim().min(1, '은행을 선택해 주세요.').max(30),
  bankAccount: z.string().transform((v) => v.replace(/\D/g, '')).refine((v) => v.length >= 8 && v.length <= 16, '계좌번호를 정확히 입력해 주세요.'),
  accountHolder: z.string().trim().min(1, '예금주를 입력해 주세요.').max(50),
  channelUrl: z.union([z.string().trim().url('주소 형식을 확인해 주세요.').max(300), z.literal('')]).optional(),
  agreed: z.literal(true, { errorMap: () => ({ message: '약관에 동의해 주세요.' }) }),
})

function newCode(): string {
  return 'S-' + randomBytes(4).toString('hex').toUpperCase()
}

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? '입력값을 확인해 주세요.' }, { status: 400 })
  }
  const v = parsed.data
  try {
    const db = getSupabaseAdmin()
    const passwordHash = await bcrypt.hash(v.password, 10)
    const { error } = await db.from('admin_users').insert({
      login_id: v.loginId,
      password_hash: passwordHash,
      unique_code: newCode(),
      nickname: v.nickname,
      role: 'marketer',
      status: 'pending',
      phone: v.phone.replace(/\D/g, ''),
      bank_name: v.bankName,
      bank_account: v.bankAccount,
      account_holder: v.accountHolder,
      channel_url: v.channelUrl || null,
      applied_at: new Date().toISOString(),
    })
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: '이미 사용 중인 아이디예요.' }, { status: 400 })
      throw error
    }
    console.info(`[Partners] 가입 신청: ${v.loginId}`)
    // 접수 안내는 가입과 별개. 실패해도 신청은 유효하다.
    await sendPartnerSignupAlimtalk(v.phone, v.nickname)
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error('[Partners] 가입 신청 실패:', error)
    return NextResponse.json({ error: '가입 신청 처리 중 문제가 생겼어요.' }, { status: 500 })
  }
}
