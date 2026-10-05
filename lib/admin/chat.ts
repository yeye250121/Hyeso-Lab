import type { SupabaseClient } from '@supabase/supabase-js'

// 관리자 채팅 공통. 방은 세 종류다: notice(공지, 전원) · direct(1:1) · group(그룹).

export type ChatRoomType = 'notice' | 'direct' | 'group'

/** 이 관리자가 들어갈 수 있는 방이면 방 정보를 돌려준다. 공지는 누구나, 나머지는 구성원만 */
export async function findAccessibleRoom(supabase: SupabaseClient, roomId: string, adminId: string) {
  const { data: room, error } = await supabase
    .from('admin_chat_rooms')
    .select('id, type')
    .eq('id', roomId)
    .maybeSingle()
  if (error) throw error
  if (!room) return null
  if (room.type === 'notice') return room as { id: string; type: ChatRoomType }

  const { data: member, error: e2 } = await supabase
    .from('admin_chat_members')
    .select('admin_id')
    .eq('room_id', roomId)
    .eq('admin_id', adminId)
    .maybeSingle()
  if (e2) throw e2
  return member ? (room as { id: string; type: ChatRoomType }) : null
}

/** 여기까지 읽었다고 적는다. 공지방은 이때 구성원 행이 처음 생긴다 */
export async function markRead(supabase: SupabaseClient, roomId: string, adminId: string, lastId: number) {
  if (lastId <= 0) return
  const { error } = await supabase
    .from('admin_chat_members')
    .upsert({ room_id: roomId, admin_id: adminId, last_read_id: lastId }, { onConflict: 'room_id,admin_id' })
  if (error) throw error
}

export const directKey = (a: string, b: string) => [a, b].sort().join(':')
