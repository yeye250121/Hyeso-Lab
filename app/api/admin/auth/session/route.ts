import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin/auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// 세션 확인. 토큰이 유효해도 계정이 승인 대기·거부·비활성 상태면 끊는다(대표자가 중간에 막을 수 있게).
export async function GET(request: NextRequest) {
  const admin = getAdminContext(request)
  if (!admin) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }
  const { data } = await getSupabaseAdmin().from('admin_users').select('status, role').eq('id', admin.id).maybeSingle()
  if (!data || (data.status && data.status !== 'active')) {
    const res = NextResponse.json({ error: '사용할 수 없는 계정입니다.' }, { status: 401 })
    res.cookies.delete('admin-token')
    return res
  }
  return NextResponse.json({ admin })
}
