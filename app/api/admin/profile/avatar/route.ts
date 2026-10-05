import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'

export const runtime = 'nodejs'

// 프로필 사진. 화면에서 정사각형 256px 로 줄여 보내므로 여기서는 형식과 크기만 확인한다.
// 관리자마다 파일 하나(admin/avatars/<id>.<ext>)를 덮어쓰고, 주소에 ?v= 를 붙여 캐시를 피한다.
const TYPES: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' }
const MAX = 1024 * 1024

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request)
  if (!admin) return unauthorizedResponse()
  try {
    const file = (await request.formData()).get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: '이미지 파일이 필요합니다.' }, { status: 400 })
    }
    const ext = TYPES[file.type]
    if (!ext || file.size <= 0 || file.size > MAX) {
      return NextResponse.json({ error: 'JPG·PNG·WEBP, 1MB 이하 이미지만 올릴 수 있습니다.' }, { status: 400 })
    }
    const supabase = getSupabaseAdmin()
    const path = `admin/avatars/${admin.id}.${ext}`
    const { error } = await supabase.storage
      .from('HYESO-LAB')
      .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: true, cacheControl: '31536000' })
    if (error) throw error
    const url = `${supabase.storage.from('HYESO-LAB').getPublicUrl(path).data.publicUrl}?v=${Date.now()}`
    const { error: e2 } = await supabase.from('admin_users').update({ avatar_url: url }).eq('id', admin.id)
    if (e2) throw e2
    return NextResponse.json({ avatarUrl: url }, { status: 201 })
  } catch (error) {
    return routeError('Admin Avatar', error, '사진을 올리지 못했습니다.')
  }
}

export async function DELETE(request: NextRequest) {
  const admin = requireAdmin(request)
  if (!admin) return unauthorizedResponse()
  try {
    const { error } = await getSupabaseAdmin().from('admin_users').update({ avatar_url: null }).eq('id', admin.id)
    if (error) throw error
    return NextResponse.json({ avatarUrl: null })
  } catch (error) {
    return routeError('Admin Avatar', error, '사진을 지우지 못했습니다.')
  }
}
