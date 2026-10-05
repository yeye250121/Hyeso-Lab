import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'
import { directKey } from '@/lib/admin/chat'

export const dynamic = 'force-dynamic'

// 방 만들기. 1:1 은 같은 두 사람 사이에 하나만 있고, 이미 있으면 그 방을 돌려준다.
const schema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('direct'), adminId: z.string().uuid() }),
  z.object({
    type: z.literal('group'),
    name: z.string().trim().min(1).max(30),
    memberIds: z.array(z.string().uuid()).min(1).max(50),
  }),
])

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request)
  if (!admin) return unauthorizedResponse()

  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: '입력값을 확인해주세요.' }, { status: 400 })
    }
    const supabase = getSupabaseAdmin()
    const input = parsed.data
    const wanted = input.type === 'direct' ? [input.adminId] : input.memberIds
    const others = [...new Set(wanted)].filter((id) => id !== admin.id)
    if (others.length === 0) {
      return NextResponse.json({ error: '대화 상대를 선택해주세요.' }, { status: 400 })
    }

    // 실제 관리자 계정인지 확인
    const { data: found, error: e0 } = await supabase.from('admin_users').select('id').in('id', others)
    if (e0) throw e0
    if ((found ?? []).length !== others.length) {
      return NextResponse.json({ error: '없는 구성원이 포함되어 있습니다.' }, { status: 400 })
    }

    if (input.type === 'direct') {
      const key = directKey(admin.id, others[0])
      const { data: existing, error: e1 } = await supabase
        .from('admin_chat_rooms')
        .select('id')
        .eq('direct_key', key)
        .maybeSingle()
      if (e1) throw e1
      if (existing) return NextResponse.json({ roomId: existing.id })

      const { data: room, error: e2 } = await supabase
        .from('admin_chat_rooms')
        .insert({ type: 'direct', direct_key: key, created_by: admin.id })
        .select('id')
        .single()
      if (e2) {
        // 두 사람이 동시에 눌렀으면 unique 충돌이 난다. 먼저 만들어진 방을 쓴다
        const { data: again } = await supabase.from('admin_chat_rooms').select('id').eq('direct_key', key).maybeSingle()
        if (again) return NextResponse.json({ roomId: again.id })
        throw e2
      }
      const { error: e3 } = await supabase
        .from('admin_chat_members')
        .insert([admin.id, others[0]].map((id) => ({ room_id: room.id, admin_id: id })))
      if (e3) throw e3
      return NextResponse.json({ roomId: room.id }, { status: 201 })
    }

    const { data: room, error: e4 } = await supabase
      .from('admin_chat_rooms')
      .insert({ type: 'group', name: input.name, created_by: admin.id })
      .select('id')
      .single()
    if (e4) throw e4
    const { error: e5 } = await supabase
      .from('admin_chat_members')
      .insert([admin.id, ...others].map((id) => ({ room_id: room.id, admin_id: id })))
    if (e5) throw e5
    return NextResponse.json({ roomId: room.id }, { status: 201 })
  } catch (error) {
    return routeError('Admin Chat Rooms', error, '대화방을 만들지 못했습니다.')
  }
}
