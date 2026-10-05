import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const admin = requireAdmin(request)
  if (!admin) return unauthorizedResponse()
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('admin_users')
      .select('id, login_id, nickname, avatar_url')
      .eq('id', admin.id)
      .single()
    if (error) throw error
    return NextResponse.json({
      profile: { id: data.id, loginId: data.login_id, nickname: data.nickname ?? '', avatarUrl: data.avatar_url ?? null },
    })
  } catch (error) {
    return routeError('Admin Profile', error, '프로필을 불러오지 못했습니다.')
  }
}

const patchSchema = z.object({ nickname: z.string().trim().min(1).max(20) })

export async function PATCH(request: NextRequest) {
  const admin = requireAdmin(request)
  if (!admin) return unauthorizedResponse()
  try {
    const parsed = patchSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: '이름은 1~20자로 입력해주세요.' }, { status: 400 })
    }
    const { error } = await getSupabaseAdmin()
      .from('admin_users')
      .update({ nickname: parsed.data.nickname })
      .eq('id', admin.id)
    if (error) throw error
    return NextResponse.json({ nickname: parsed.data.nickname })
  } catch (error) {
    return routeError('Admin Profile', error, '프로필을 저장하지 못했습니다.')
  }
}
