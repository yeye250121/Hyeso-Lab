import { randomBytes } from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { buildStatement, type StatementKind } from './statement'

// 담당자 전용 명세서 링크(/s/<token>). 알림톡 버튼이 이 링크를 연다.
// 토큰은 24바이트 난수(URL-safe)라 추측이 불가능하고, 기본 120시간 뒤 만료된다.

export const STATEMENT_LINK_HOURS = Number(process.env.STATEMENT_LINK_HOURS || 120)

const TABLE: Record<StatementKind, string> = {
  lead: 'leads',
  electronics_application: 'electronics_applications',
  internet_application: 'internet_applications',
}

export function newLinkToken(): string {
  return randomBytes(24).toString('base64url')
}

export async function createStatementLink(kind: StatementKind, refId: string, adminId: string | null): Promise<{ token: string; expiresAt: string }> {
  const token = newLinkToken()
  const expiresAt = new Date(Date.now() + STATEMENT_LINK_HOURS * 3600 * 1000).toISOString()
  const { error } = await getSupabaseAdmin().from('statement_links').insert({ token, kind, ref_id: refId, created_by: adminId, expires_at: expiresAt })
  if (error) throw error
  return { token, expiresAt }
}

export type StatementView =
  | { status: 'ok'; kind: StatementKind; text: string; expiresAt: string; refNo: string }
  | { status: 'expired' | 'missing' }

/** 토큰으로 명세서를 찾아 본문을 만들고 열람 기록을 남긴다 */
export async function viewStatementByToken(token: string): Promise<StatementView> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return { status: 'missing' }
  const db = getSupabaseAdmin()
  const { data: link, error } = await db.from('statement_links').select('*').eq('token', token).maybeSingle()
  if (error) throw error
  if (!link) return { status: 'missing' }
  if (link.revoked_at || new Date(link.expires_at).getTime() < Date.now()) return { status: 'expired' }

  const kind = link.kind as StatementKind
  const { data: row, error: rowError } = await db.from(TABLE[kind]).select('*').eq('id', link.ref_id).maybeSingle()
  if (rowError) throw rowError
  if (!row) return { status: 'missing' }

  await db
    .from('statement_links')
    .update({ view_count: (link.view_count ?? 0) + 1, last_viewed_at: new Date().toISOString() })
    .eq('id', link.id)
  console.info(`[Statement] 담당자 열람: kind=${kind} ref=${link.ref_id} views=${(link.view_count ?? 0) + 1}`)

  const prefix = kind === 'internet_application' ? 'I' : kind === 'electronics_application' ? 'A' : 'L'
  return { status: 'ok', kind, text: buildStatement(kind, row), expiresAt: link.expires_at, refNo: `${prefix}-${String(row.id).slice(0, 8).toUpperCase()}` }
}

/** 관리자 "담당자에게 보내기" 공용 처리: 사은품 저장 → 링크 생성 → 알림톡 → 전달 시각 기록 */
export async function deliverStatement(opts: {
  kind: StatementKind
  refId: string
  adminId: string | null
  giftAmount: number | null | undefined
}) {
  const db = getSupabaseAdmin()
  const table = TABLE[opts.kind]

  if (opts.giftAmount !== undefined) {
    const { error } = await db.from(table).update({ gift_amount: opts.giftAmount }).eq('id', opts.refId)
    if (error) throw error
  }
  const { data: row, error } = await db.from(table).select('*').eq('id', opts.refId).maybeSingle()
  if (error) throw error
  if (!row) return null

  const { token, expiresAt } = await createStatementLink(opts.kind, opts.refId, opts.adminId)
  const { statementSummary, giftText } = await import('./statement')
  const { sendVendorStatementAlimtalk } = await import('@/lib/alimtalk-service')
  const summary = statementSummary(opts.kind, row)
  const sent = await sendVendorStatementAlimtalk({
    ...summary,
    giftLabel: giftText(row.gift_amount),
    token,
    leadId: opts.kind === 'lead' ? opts.refId : (row.lead_id as string | null) ?? null,
    applicationRef: opts.kind === 'lead' ? null : opts.refId,
  })

  const sentAt = new Date().toISOString()
  const patch: Record<string, unknown> = { statement_sent_at: sentAt }
  if (opts.kind !== 'lead' && row.status === 'new') patch.status = 'in_progress'
  const { error: updError } = await db.from(table).update(patch).eq('id', opts.refId)
  if (updError) throw updError

  return { sentAt, status: (patch.status as string | undefined) ?? (row.status as string), token, expiresAt, alimtalk: sent }
}
