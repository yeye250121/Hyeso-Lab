import { createHmac, randomBytes } from 'crypto'

/**
 * 솔라피(SOLAPI) 알림톡 클라이언트.
 * 뿌리오와 달리 발신 IP 등록이 없어 Vercel 함수에서 바로 호출한다.
 * 인증은 요청마다 HMAC-SHA256 서명(date + salt)이다.
 *
 * 환경변수: SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_PFID(카카오 채널 ID), SOLAPI_SENDER_NUMBER(발신번호)
 */

const API_BASE = 'https://api.solapi.com'

export type AlimtalkVariables = Record<string, string> // 키는 '#{token}' 처럼 템플릿 변수명 그대로

export type SolapiSendResult = {
  groupId: string | null
  /** 솔라피가 접수 단계에서 거절한 건. 비어 있으면 접수 성공 */
  failed: { to: string; statusCode: string; statusMessage: string }[]
}

function config() {
  const apiKey = process.env.SOLAPI_API_KEY || ''
  const apiSecret = process.env.SOLAPI_API_SECRET || ''
  const pfId = process.env.SOLAPI_PFID || ''
  const from = (process.env.SOLAPI_SENDER_NUMBER || '').replace(/\D/g, '')
  if (!apiKey || !apiSecret || !pfId || !from) {
    throw new Error('솔라피 환경변수(SOLAPI_API_KEY/SECRET/PFID/SENDER_NUMBER)가 설정되지 않았습니다.')
  }
  return { apiKey, apiSecret, pfId, from }
}

export function isSolapiConfigured(): boolean {
  return !!(process.env.SOLAPI_API_KEY && process.env.SOLAPI_API_SECRET && process.env.SOLAPI_PFID && process.env.SOLAPI_SENDER_NUMBER)
}

function authHeader(apiKey: string, apiSecret: string): string {
  const date = new Date().toISOString()
  const salt = randomBytes(16).toString('hex')
  const signature = createHmac('sha256', apiSecret).update(date + salt).digest('hex')
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`
}

/**
 * 알림톡 1건 발송. 카카오 미수신 시 문자 대체발송은 하지 않는다(disableSms).
 */
export async function sendAlimtalk(opts: {
  to: string
  templateId: string
  variables?: AlimtalkVariables
  /** 카톡 미수신(채널 차단·미설치) 시 이 문구로 문자(SMS/LMS) 대체 발송. 없으면 대체 발송 안 함 */
  smsFallbackText?: string
}): Promise<SolapiSendResult> {
  const { apiKey, apiSecret, pfId, from } = config()
  const to = opts.to.replace(/\D/g, '')

  const body = {
    messages: [
      {
        to,
        from,
        ...(opts.smsFallbackText ? { text: opts.smsFallbackText } : {}),
        kakaoOptions: {
          pfId,
          templateId: opts.templateId,
          variables: opts.variables ?? {},
          disableSms: !opts.smsFallbackText,
        },
      },
    ],
  }

  const res = await fetch(`${API_BASE}/messages/v4/send-many/detail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader(apiKey, apiSecret) },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  const text = await res.text()
  let json: Record<string, unknown> = {}
  try {
    json = JSON.parse(text)
  } catch {
    /* not json */
  }

  if (!res.ok) {
    const code = (json.errorCode as string) || res.status
    const message = (json.errorMessage as string) || text.slice(0, 200)
    throw new Error(`솔라피 오류(${code}): ${message}`)
  }

  const groupInfo = (json.groupInfo ?? {}) as { groupId?: string }
  const failedList = (json.failedMessageList ?? []) as { to: string; statusCode: string; statusMessage: string }[]
  return {
    groupId: groupInfo.groupId ?? null,
    failed: failedList.map((f) => ({ to: f.to, statusCode: f.statusCode, statusMessage: f.statusMessage })),
  }
}
