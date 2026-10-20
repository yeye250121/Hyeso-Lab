import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'

// 구성원 목록. 오너만.
export async function GET(request: NextRequest) {
  const admin = requireAdmin(request, ['owner'])
  if (!admin) return unauthorizedResponse()
  try {
    const db = getSupabaseAdmin()
    const [{ data, error }, { data: leadCounts }] = await Promise.all([
      db.from('admin_users').select('id, login_id, nickname, unique_code, role, phone, notify_leads, avatar_url, created_at').order('created_at'),
      db.from('leads').select('marketer_code').neq('marketer_code', ''),
    ])
    if (error) throw error
    const counts = new Map<string, number>()
    for (const l of leadCounts ?? []) counts.set(l.marketer_code as string, (counts.get(l.marketer_code as string) ?? 0) + 1)
    return NextResponse.json({
      members: (data ?? []).map((m) => ({
        id: m.id,
        loginId: m.login_id,
        nickname: m.nickname,
        code: m.unique_code,
        role: m.role,
        phone: m.phone,
        notifyLeads: m.notify_leads,
        avatarUrl: m.avatar_url,
        leadCount: counts.get(m.unique_code as string) ?? 0,
        createdAt: m.created_at,
        isSelf: m.id === admin.id,
      })),
    })
  } catch (error) {
    return routeError('Admin Members', error, '구성원을 불러오지 못했습니다.')
  }
}
