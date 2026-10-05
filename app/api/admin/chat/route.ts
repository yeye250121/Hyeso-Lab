import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'

export const dynamic = 'force-dynamic'

// 관리자 내부 채팅(전체 한 방). 실시간 연결 대신 화면이 몇 초마다 ?after=<마지막 id> 로 새 글만 받아 간다.
const PAGE = 100

type Row = {
  id: number
  body: string
  created_at: string
  admin_id: string
  admin_users: { nickname: string | null; login_id: string; avatar_url: string | null } | null
}

function toMessage(r: Row) {
  return {
    id: r.id,
    body: r.body,
    createdAt: r.created_at,
    author: {
      id: r.admin_id,
      name: r.admin_users?.nickname || r.admin_users?.login_id || '알 수 없음',
      avatarUrl: r.admin_users?.avatar_url ?? null,
    },
  }
}

const SELECT = 'id, body, created_at, admin_id, admin_users(nickname, login_id, avatar_url)'

export async function GET(request: NextRequest) {
  const admin = requireAdmin(request)
  if (!admin) return unauthorizedResponse()

  try {
    const supabase = getSupabaseAdmin()
    const after = Number(request.nextUrl.searchParams.get('after') ?? 0)

    // 안 읽은 개수만 필요할 때(사이드바 뱃지)
    if (request.nextUrl.searchParams.get('count') === '1') {
      const { count, error } = await supabase
        .from('admin_chat_messages')
        .select('id', { count: 'exact', head: true })
        .gt('id', after)
        .neq('admin_id', admin.id)
      if (error) throw error
      return NextResponse.json({ count: count ?? 0 })
    }

    let query = supabase.from('admin_chat_messages').select(SELECT)
    if (after > 0) query = query.gt('id', after).order('id', { ascending: true }).limit(PAGE)
    else query = query.order('id', { ascending: false }).limit(PAGE)
    const { data, error } = await query
    if (error) throw error

    const rows = (data ?? []) as unknown as Row[]
    if (after <= 0) rows.reverse()
    return NextResponse.json({ messages: rows.map(toMessage), me: admin.id })
  } catch (error) {
    return routeError('Admin Chat', error, '채팅을 불러오지 못했습니다.')
  }
}

const postSchema = z.object({ body: z.string().trim().min(1).max(2000) })

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request)
  if (!admin) return unauthorizedResponse()

  try {
    const parsed = postSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: '메시지는 1~2000자로 입력해주세요.' }, { status: 400 })
    }
    const { data, error } = await getSupabaseAdmin()
      .from('admin_chat_messages')
      .insert({ admin_id: admin.id, body: parsed.data.body })
      .select(SELECT)
      .single()
    if (error) throw error
    return NextResponse.json({ message: toMessage(data as unknown as Row) }, { status: 201 })
  } catch (error) {
    return routeError('Admin Chat', error, '메시지를 보내지 못했습니다.')
  }
}
