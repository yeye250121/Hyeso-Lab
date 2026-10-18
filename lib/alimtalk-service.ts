/**
 * 알림톡 발송 서비스. 비즈니스 시나리오별 함수 + 발송 로그.
 * 발송 실패는 접수 실패가 아니다 — 호출하는 쪽은 결과만 기록하고 흐름을 계속한다.
 */
import { getSupabaseAdmin } from './supabase-admin'
import { isSolapiConfigured, sendAlimtalk, type AlimtalkVariables } from './solapi'
import { ALIMTALK_TEMPLATES } from './alimtalk-templates'

export type SendResult = { success: boolean; skipped?: boolean; groupId?: string | null; error?: string }

async function sendAndLog(opts: {
  purpose: string
  to: string
  templateId: string
  variables: AlimtalkVariables
  leadId?: string | null
  applicationRef?: string | null
}): Promise<SendResult> {
  if (!isSolapiConfigured()) return { success: false, skipped: true, error: 'solapi not configured' }
  if (!opts.templateId) return { success: false, skipped: true, error: 'template not configured' }

  let result: SendResult
  try {
    const r = await sendAlimtalk({ to: opts.to, templateId: opts.templateId, variables: opts.variables })
    result = r.failed.length
      ? { success: false, groupId: r.groupId, error: `${r.failed[0].statusCode} ${r.failed[0].statusMessage}` }
      : { success: true, groupId: r.groupId }
  } catch (e) {
    result = { success: false, error: e instanceof Error ? e.message : String(e) }
  }

  const { error } = await getSupabaseAdmin().from('alimtalk_logs').insert({
    purpose: opts.purpose,
    lead_id: opts.leadId ?? null,
    application_ref: opts.applicationRef ?? null,
    to_phone: opts.to.replace(/\D/g, ''),
    template_id: opts.templateId,
    variables: opts.variables,
    success: result.success,
    provider_group_id: result.groupId ?? null,
    error: result.error ?? null,
  })
  if (error) console.error('[Alimtalk] 로그 기록 실패:', error.message)
  if (!result.success) console.error(`[Alimtalk] ${opts.purpose} 발송 실패:`, result.error)
  return result
}

/**
 * 상담 신청 접수 안내(신청서 작성 링크). 상담 신청 직후, 그리고 관리자 재발송에서 쓴다.
 * 성공/실패를 leads.alimtalk_sent_at / alimtalk_error 에 남긴다.
 */
export async function sendApplicationLinkAlimtalk(lead: {
  id: string
  phone_number: string
  short_token: string | null
}): Promise<SendResult> {
  if (!lead.short_token) return { success: false, skipped: true, error: 'short token missing' }

  const result = await sendAndLog({
    purpose: 'application_link',
    to: lead.phone_number,
    templateId: ALIMTALK_TEMPLATES.APPLICATION_LINK,
    variables: { '#{token}': lead.short_token },
    leadId: lead.id,
  })

  if (!result.skipped) {
    const { error } = await getSupabaseAdmin()
      .from('leads')
      .update(result.success ? { alimtalk_sent_at: new Date().toISOString(), alimtalk_error: null } : { alimtalk_error: result.error ?? '발송 실패' })
      .eq('id', lead.id)
    if (error) console.error('[Alimtalk] lead 갱신 실패:', error.message)
  }
  return result
}
