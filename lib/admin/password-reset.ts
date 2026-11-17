import { createHash, randomBytes } from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// 비밀번호 재설정 토큰. 원문은 링크에만 실리고 DB 에는 해시만 남는다. 30분 유효, 1회용.
export const RESET_TTL_MINUTES = 30
const PER_USER_LIMIT = 3 // 15분 안에 같은 계정 요청 상한
const PER_IP_LIMIT = 10 // 15분 안에 같은 IP 요청 상한

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function newResetToken(): string {
  return randomBytes(32).toString('base64url')
}

export function isTokenShape(token: unknown): token is string {
  return typeof token === 'string' && /^[A-Za-z0-9_-]{40,64}$/.test(token)
}

/** 요청 과다 여부. 계정 존재 여부를 응답으로 드러내지 않게, 막혀도 호출한 쪽은 같은 응답을 준다 */
export async function overLimit(userId: string | null, ip: string | null): Promise<boolean> {
  const db = getSupabaseAdmin()
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  if (userId) {
    const { count } = await db.from('password_resets').select('id', { count: 'exact', head: true }).eq('admin_user_id', userId).gte('created_at', since)
    if ((count ?? 0) >= PER_USER_LIMIT) return true
  }
  if (ip) {
    const { count } = await db.from('password_resets').select('id', { count: 'exact', head: true }).eq('requested_ip', ip).gte('created_at', since)
    if ((count ?? 0) >= PER_IP_LIMIT) return true
  }
  return false
}

export async function issueResetToken(userId: string, ip: string | null): Promise<string> {
  const token = newResetToken()
  const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000).toISOString()
  const { error } = await getSupabaseAdmin().from('password_resets').insert({ admin_user_id: userId, token_hash: hashToken(token), expires_at: expiresAt, requested_ip: ip })
  if (error) throw error
  return token
}

export type ResetRow = { id: string; admin_user_id: string; expires_at: string; used_at: string | null }

/** 살아 있는 토큰이면 행을 돌려준다(없음·만료·사용됨은 모두 null) */
export async function findLiveReset(token: string): Promise<ResetRow | null> {
  if (!isTokenShape(token)) return null
  const { data } = await getSupabaseAdmin().from('password_resets').select('id, admin_user_id, expires_at, used_at').eq('token_hash', hashToken(token)).maybeSingle()
  if (!data || data.used_at || new Date(data.expires_at as string).getTime() < Date.now()) return null
  return data as ResetRow
}
