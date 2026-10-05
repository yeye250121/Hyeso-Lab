import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'

export const dynamic = 'force-dynamic'

// 채팅 첫 화면에 필요한 것: 구성원 목록과 내 방 목록(마지막 글·안 읽은 수).
// ?count=1 이면 안 읽은 글의 합계만 준다(사이드바 뱃지).

type OverviewRow = {
  room_id: string
  type: 'notice' | 'direct' | 'group'
  name: string | null
  member_ids: string[]
  last_body: string | null
  last_at: string | null
  last_author: string | null
  unread: number
  created_at: string
}

export async function GET(request: NextRequest) {
  const admin = requireAdmin(request)
  if (!admin) return unauthorizedResponse()

  try {
    const supabase = getSupabaseAdmin()
    const { data: overview, error } = await supabase.rpc('admin_chat_overview', { p_admin: admin.id })
    if (error) throw error
    const rows = (overview ?? []) as OverviewRow[]

    if (request.nextUrl.searchParams.get('count') === '1') {
      return NextResponse.json({ count: rows.reduce((sum, r) => sum + Number(r.unread), 0) })
    }

    const { data: users, error: e2 } = await supabase
      .from('admin_users')
      .select('id, login_id, nickname, avatar_url')
      .order('created_at', { ascending: true })
    if (e2) throw e2
    const members = (users ?? []).map((u) => ({
      id: u.id as string,
      name: (u.nickname || u.login_id) as string,
      avatarUrl: (u.avatar_url ?? null) as string | null,
    }))
    const byId = new Map(members.map((m) => [m.id, m]))

    const rooms = rows
      .map((r) => {
        const peer = r.type === 'direct' ? byId.get(r.member_ids.find((id) => id !== admin.id) ?? '') : undefined
        const others = r.member_ids.filter((id) => id !== admin.id).map((id) => byId.get(id)?.name).filter(Boolean)
        return {
          id: r.room_id,
          type: r.type,
          title:
            r.type === 'notice' ? '공지' : r.type === 'direct' ? peer?.name ?? '알 수 없음' : r.name || others.join(', ') || '그룹',
          avatarUrl: peer?.avatarUrl ?? null,
          memberIds: r.type === 'notice' ? members.map((m) => m.id) : r.member_ids,
          lastMessage: r.last_body
            ? { body: r.last_body, createdAt: r.last_at, authorName: byId.get(r.last_author ?? '')?.name ?? '' }
            : null,
          unread: Number(r.unread),
          sortAt: r.last_at ?? r.created_at,
        }
      })
      // 공지는 항상 맨 위, 나머지는 최근 대화 순
      .sort((a, b) =>
        a.type === 'notice' ? -1 : b.type === 'notice' ? 1 : new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime()
      )

    return NextResponse.json({ me: admin.id, members, rooms })
  } catch (error) {
    return routeError('Admin Chat', error, '채팅을 불러오지 못했습니다.')
  }
}
