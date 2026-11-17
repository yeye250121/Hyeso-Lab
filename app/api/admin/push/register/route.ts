import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'
import { ALL_ROLES } from '@/lib/admin/auth'

// 앱 푸시 토큰 등록·해제. 전 구성원. 같은 토큰을 다른 계정이 등록하면 주인이 바뀐다(기기 공유·재로그인).
const schema = z.object({
  token: z.string().trim().min(16).max(4096),
  platform: z.enum(['ios', 'android']),
  appVersion: z.string().trim().max(40).optional(),
})

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request, ALL_ROLES)
  if (!admin) return unauthorizedResponse()
  const parsed = schema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: '올바르지 않은 값입니다.' }, { status: 400 })
  try {
    const { error } = await getSupabaseAdmin()
      .from('push_devices')
      .upsert(
        // appVersion 을 안 보낸 재등록은 기존 버전 값을 지우지 않는다
        { token: parsed.data.token, platform: parsed.data.platform, admin_user_id: admin.id, last_seen_at: new Date().toISOString(), ...(parsed.data.appVersion ? { app_version: parsed.data.appVersion } : {}) },
        { onConflict: 'token' }
      )
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return routeError('Admin Push Register', error, '푸시 토큰을 저장하지 못했습니다.')
  }
}

export async function DELETE(request: NextRequest) {
  const admin = requireAdmin(request, ALL_ROLES)
  if (!admin) return unauthorizedResponse()
  const token = (await request.json().catch(() => ({})))?.token
  if (typeof token !== 'string' || !token) return NextResponse.json({ error: '토큰이 필요합니다.' }, { status: 400 })
  try {
    // 본인 기기만 지운다
    const { error } = await getSupabaseAdmin().from('push_devices').delete().eq('token', token).eq('admin_user_id', admin.id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return routeError('Admin Push Unregister', error, '푸시 토큰을 지우지 못했습니다.')
  }
}
