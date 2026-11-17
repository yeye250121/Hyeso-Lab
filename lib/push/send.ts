import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { apnsConfigured, sendApns, type PushMessage } from './apns'
import { fcmConfigured, sendFcm } from './fcm'

// 구성원 여러 명에게 앱 푸시. 알림톡과 독립적이고, 실패해도 호출한 쪽 흐름을 막지 않는다.
// 등록된 기기가 없거나 env 가 없으면 조용히 건너뛴다(로그만). 더 못 쓰는 토큰은 지운다.
export type { PushMessage }

let warnedUnconfigured = false

export async function pushToUsers(userIds: string[], msg: PushMessage): Promise<{ sent: number; failed: number; skipped?: boolean }> {
  const ids = [...new Set(userIds.filter(Boolean))]
  if (ids.length === 0) return { sent: 0, failed: 0, skipped: true }
  if (!apnsConfigured() && !fcmConfigured()) {
    if (!warnedUnconfigured) { console.warn('[Push] APNS_*/FCM_* env 가 없어 앱 푸시를 보내지 않습니다.'); warnedUnconfigured = true }
    return { sent: 0, failed: 0, skipped: true }
  }
  const db = getSupabaseAdmin()
  const { data: devices, error } = await db.from('push_devices').select('id, platform, token').in('admin_user_id', ids)
  if (error) { console.error('[Push] 기기 조회 실패:', error.message); return { sent: 0, failed: 0, skipped: true } }
  if (!devices?.length) return { sent: 0, failed: 0, skipped: true }

  const results = await Promise.all(
    devices.map(async (d) => ({ d, r: d.platform === 'ios' ? await sendApns(d.token as string, msg) : await sendFcm(d.token as string, msg) }))
  )
  const dead = results.filter(({ r }) => r.dead).map(({ d }) => d.id as string)
  if (dead.length) await db.from('push_devices').delete().in('id', dead)
  const sent = results.filter(({ r }) => r.ok).length
  const failed = results.length - sent
  for (const { d, r } of results) if (!r.ok) console.warn(`[Push] ${d.platform} 실패 ${r.status ?? ''} ${r.reason ?? ''}${r.dead ? ' (토큰 삭제)' : ''}`)
  console.info(`[Push] "${msg.title}" → 기기 ${results.length}대, 성공 ${sent}, 실패 ${failed}`)
  return { sent, failed }
}
