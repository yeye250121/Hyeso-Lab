import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'

export const dynamic = 'force-dynamic'

// 내 비밀번호 바꾸기. 로그인돼 있어도 현재 비밀번호를 다시 확인한다(자리를 비운 사이 남이 바꾸지 못하게).
const schema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(72), // bcrypt 는 72바이트까지만 본다
})

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request)
  if (!admin) return unauthorizedResponse()

  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: '새 비밀번호는 8자 이상으로 입력해주세요.' }, { status: 400 })
    }
    const { currentPassword, newPassword } = parsed.data
    if (currentPassword === newPassword) {
      return NextResponse.json({ error: '현재 비밀번호와 다른 비밀번호를 입력해주세요.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('id, password_hash')
      .eq('id', admin.id)
      .single()
    if (error) throw error

    if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
      // 401 을 주면 화면의 공통 처리가 로그아웃시켜 버린다. 입력 오류로 돌려준다
      return NextResponse.json({ error: '현재 비밀번호가 일치하지 않습니다.' }, { status: 400 })
    }

    const { error: e2 } = await supabase
      .from('admin_users')
      .update({ password_hash: await bcrypt.hash(newPassword, 10) })
      .eq('id', admin.id)
    if (e2) throw e2
    return NextResponse.json({ ok: true })
  } catch (error) {
    return routeError('Admin Password', error, '비밀번호를 바꾸지 못했습니다.')
  }
}
