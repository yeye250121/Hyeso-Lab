/**
 * 알림톡 발송 서비스. 비즈니스 시나리오별 함수 + 발송 로그.
 * 발송 실패는 접수 실패가 아니다 — 호출하는 쪽은 결과만 기록하고 흐름을 계속한다.
 */
import { getSupabaseAdmin } from './supabase-admin'
import { isSolapiConfigured, sendAlimtalk, type AlimtalkVariables } from './solapi'
import { ALIMTALK_TEMPLATES, VENDOR_ALIMTALK_PHONE } from './alimtalk-templates'
import { maskName } from './admin/mask'

export type SendResult = { success: boolean; skipped?: boolean; groupId?: string | null; error?: string }

async function sendAndLog(opts: {
  purpose: string
  to: string
  templateId: string
  variables: AlimtalkVariables
  leadId?: string | null
  applicationRef?: string | null
  smsFallbackText?: string
}): Promise<SendResult> {
  if (!isSolapiConfigured()) return { success: false, skipped: true, error: 'solapi not configured' }
  if (!opts.templateId) return { success: false, skipped: true, error: 'template not configured' }

  let result: SendResult
  try {
    const r = await sendAlimtalk({ to: opts.to, templateId: opts.templateId, variables: opts.variables, smsFallbackText: opts.smsFallbackText })
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

const SERVICE_LABEL: Record<string, string> = { card: '카드', internet: '인터넷', electronics: '가전렌탈' }

function kstTime(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getUTCMonth() + 1)}/${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
}

/**
 * 새 상담 신청 → 알림을 켠 관리자 전원에게. 카톡 미수신이면 문자로 대체 발송한다.
 * 실패해도 접수에는 영향이 없다.
 */
export async function sendAdminNewLeadAlimtalk(lead: {
  id: string
  service: string
  applicant_name: string | null
  product_label: string | null
  submitted_at: string
}): Promise<SendResult[]> {
  const { data: admins, error } = await getSupabaseAdmin()
    .from('admin_users')
    .select('id, phone')
    .eq('notify_leads', true)
    .not('phone', 'is', null)
  if (error) {
    console.error('[Alimtalk] 관리자 조회 실패:', error.message)
    return []
  }
  const service = SERVICE_LABEL[lead.service] ?? lead.service
  const vars = {
    '#{서비스}': service,
    '#{고객명}': maskName(lead.applicant_name),
    '#{상품}': lead.product_label || '상담 후 결정',
    '#{접수시각}': kstTime(lead.submitted_at),
  }
  const sms = `[혜택연구소] 새 상담 신청\n${service} · ${vars['#{고객명}']} · ${vars['#{상품}']} · ${vars['#{접수시각}']}\n관리자 페이지에서 확인해 주세요.`
  return Promise.all(
    (admins ?? []).map((a) =>
      sendAndLog({ purpose: 'admin_new_lead', to: a.phone as string, templateId: ALIMTALK_TEMPLATES.ADMIN_NEW_LEAD, variables: vars, leadId: lead.id, smsFallbackText: sms })
    )
  )
}

/**
 * 담당자에게 접수 명세서 전달. 본문에는 해피콜에 필요한 요약만 싣고, 전문은 버튼의 보안 링크(/s/<token>)에서 본다.
 */
export async function sendVendorStatementAlimtalk(opts: {
  refNo: string
  customerName: string
  productLabel: string
  rentalStatus: string
  giftLabel: string
  token: string
  leadId?: string | null
  applicationRef?: string | null
}): Promise<SendResult> {
  if (!VENDOR_ALIMTALK_PHONE) return { success: false, skipped: true, error: 'VENDOR_ALIMTALK_PHONE not configured' }
  return sendAndLog({
    purpose: 'vendor_statement',
    to: VENDOR_ALIMTALK_PHONE,
    templateId: ALIMTALK_TEMPLATES.VENDOR_STATEMENT,
    variables: {
      '#{접수번호}': opts.refNo,
      '#{고객명}': opts.customerName,
      '#{상품}': opts.productLabel,
      '#{렌탈이용}': opts.rentalStatus,
      '#{사은품}': opts.giftLabel,
      '#{token}': opts.token,
    },
    leadId: opts.leadId ?? null,
    applicationRef: opts.applicationRef ?? null,
  })
}
