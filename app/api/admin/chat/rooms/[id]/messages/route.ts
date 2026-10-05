import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'
import { findAccessibleRoom, markRead } from '@/lib/admin/chat'

export const dynamic = 'force-dynamic'

// 한 방의 글. 화면이 몇 초마다 ?after=<마지막 id> 로 새 글만 받아 가고, 받아 간 데까지 읽은 것으로 적는다.
const PAGE = 100
const SELECT = 'id, body, created_at, admin_id'
const isUuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v)

type Row = { id: number; body: string; created_at: string; admin_id: string }
const toMessage = (r: Row) => ({ id: r.id, body: r.body, createdAt: r.created_at, authorId: r.admin_id })

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = requireAdmin(request)
  if (!admin) return unauthorizedResponse()

  try {
    const supabase = getSupabaseAdmin()
    if (!isUuid(params.id) || !(await findAccessibleRoom(supabase, params.id, admin.id))) {
      return NextResponse.json({ error: '대화방을 찾을 수 없습니다.' }, { status: 404 })
    }
    const after = Number(request.nextUrl.searchParams.get('after') ?? 0)

    let query = supabase.from('admin_chat_messages').select(SELECT).eq('room_id', params.id)
    if (after > 0) query = query.gt('id', after).order('id', { ascending: true }).limit(PAGE)
    else query = query.order('id', { ascending: false }).limit(PAGE)
    const { data, error } = await query
    if (error) throw error

    const rows = (data ?? []) as Row[]
    if (after <= 0) rows.reverse()
    if (rows.length) await markRead(supabase, params.id, admin.id, rows[rows.length - 1].id)
    return NextResponse.json({ messages: rows.map(toMessage) })
  } catch (error) {
    return routeError('Admin Chat Messages', error, '대화를 불러오지 못했습니다.')
  }
}

const postSchema = z.object({ body: z.string().trim().min(1).max(2000) })

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = requireAdmin(request)
  if (!admin) return unauthorizedResponse()

  try {
    const supabase = getSupabaseAdmin()
    if (!isUuid(params.id) || !(await findAccessibleRoom(supabase, params.id, admin.id))) {
      return NextResponse.json({ error: '대화방을 찾을 수 없습니다.' }, { status: 404 })
    }
    const parsed = postSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: '메시지는 1~2000자로 입력해주세요.' }, { status: 400 })
    }
    const { data, error } = await supabase
      .from('admin_chat_messages')
      .insert({ room_id: params.id, admin_id: admin.id, body: parsed.data.body })
      .select(SELECT)
      .single()
    if (error) throw error
    await markRead(supabase, params.id, admin.id, (data as Row).id)
    return NextResponse.json({ message: toMessage(data as Row) }, { status: 201 })
  } catch (error) {
    return routeError('Admin Chat Messages', error, '메시지를 보내지 못했습니다.')
  }
}
