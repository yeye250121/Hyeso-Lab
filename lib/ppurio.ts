/**
 * 뿌리오 카카오 알림톡 API 클라이언트
 * https://www.ppurio.com
 */

// 뿌리오는 발신 IP 등록이 필수라 고정 IP 릴레이(infra/ppurio-relay)를 거친다.
// PPURIO_PROXY_URL 이 비어 있으면 직접 호출한다(로컬 테스트용, IP 가 등록된 곳에서만 된다).
const PPURIO_BASE_URL = process.env.PPURIO_PROXY_URL || 'https://message.ppurio.com'
const PPURIO_PROXY_SECRET = process.env.PPURIO_PROXY_SECRET || ''
const PPURIO_ACCOUNT = process.env.PPURIO_ACCOUNT || ''
const PPURIO_API_KEY = process.env.PPURIO_API_KEY || ''
const PPURIO_SENDER_PROFILE = process.env.PPURIO_SENDER_PROFILE || ''

// 토큰 캐싱 (24시간 유효)
let cachedToken: string | null = null
let tokenExpiry: number = 0

interface TokenResponse {
  token: string
  type: string
  expired: number
}

interface KakaoSendTarget {
  to: string // 수신 번호
  name?: string // [*이름*] 치환 문구
  changeWord?: {
    var1?: string
    var2?: string
    var3?: string
    var4?: string
    var5?: string
    var6?: string
    var7?: string
    var8?: string
  }
}

interface KakaoSendRequest {
  account: string
  messageType: 'ALT' | 'ALL' | 'ALH' | 'ALI' // ALT: 알림톡(텍스트)
  senderProfile: string
  templateCode: string
  duplicateFlag: 'Y' | 'N'
  isResend: 'Y' | 'N'
  targetCount: number
  targets: KakaoSendTarget[]
  refKey: string
  sendTime?: string // 예약 발송 시간 yyyy-MM-ddTHH:mm:ss
  resend?: {
    messageType: 'SMS' | 'LMS' | 'MMS'
    content: string
    from: string
    subject?: string
  }
}

interface KakaoSendResponse {
  code: number
  description: string
  refKey?: string
  messageKey?: string
}

/** 릴레이를 거칠 때만 비밀키 헤더를 붙인다 */
function relayHeaders(): Record<string, string> {
  return PPURIO_PROXY_SECRET ? { 'X-Relay-Secret': PPURIO_PROXY_SECRET } : {}
}

/**
 * 랜덤 refKey 생성 (32자 이내)
 */
function generateRefKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 액세스 토큰 발급
 * 토큰 유효기간: 24시간
 */
async function getAccessToken(): Promise<string> {
  // 캐싱된 토큰이 유효하면 재사용
  if (cachedToken && tokenExpiry > Date.now()) {
    return cachedToken
  }

  const basicAuth = Buffer.from(`${PPURIO_ACCOUNT}:${PPURIO_API_KEY}`).toString('base64')

  const response = await fetch(`${PPURIO_BASE_URL}/v1/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${basicAuth}`,
      ...relayHeaders(),
    },
  })

  if (!response.ok) {
    // 릴레이가 403 을 주면 비밀키 불일치, HTML 이 오면 릴레이/인증서 문제다. JSON 이 아닐 수 있다.
    const text = await response.text()
    let description = response.statusText
    try { description = JSON.parse(text).description || description } catch { /* not json */ }
    console.error('[Ppurio] Token error:', response.status, text.slice(0, 200))
    throw new Error(`뿌리오 토큰 발급 실패(${response.status}): ${description}`)
  }

  const data: TokenResponse = await response.json()

  // 토큰 캐싱 (만료 1시간 전까지 유효하게 설정)
  cachedToken = data.token
  tokenExpiry = Date.now() + (23 * 60 * 60 * 1000) // 23시간

  return data.token
}

/**
 * 카카오 알림톡 발송
 */
export async function sendKakaoAlimtalk(
  templateCode: string,
  targets: KakaoSendTarget[],
  options?: {
    sendTime?: string // 예약 발송
    resendSms?: {
      content: string
      from: string
    }
  }
): Promise<KakaoSendResponse> {
  // 환경변수 디버깅 로그
  console.log('[Ppurio] Config check:', {
    baseUrl: PPURIO_BASE_URL,
    hasAccount: !!PPURIO_ACCOUNT,
    hasApiKey: !!PPURIO_API_KEY,
    hasSenderProfile: !!PPURIO_SENDER_PROFILE,
    hasProxySecret: !!PPURIO_PROXY_SECRET,
  })

  if (!PPURIO_ACCOUNT || !PPURIO_API_KEY || !PPURIO_SENDER_PROFILE) {
    console.error('[Ppurio] Missing env vars:', {
      account: PPURIO_ACCOUNT ? 'set' : 'MISSING',
      apiKey: PPURIO_API_KEY ? 'set' : 'MISSING',
      senderProfile: PPURIO_SENDER_PROFILE ? 'set' : 'MISSING',
      proxyUrl: PPURIO_BASE_URL,
    })
    throw new Error('뿌리오 환경변수가 설정되지 않았습니다.')
  }

  const token = await getAccessToken()

  const requestBody: KakaoSendRequest = {
    account: PPURIO_ACCOUNT,
    messageType: 'ALH', // 알림톡(강조표기형)
    senderProfile: PPURIO_SENDER_PROFILE,
    templateCode,
    duplicateFlag: 'N',
    isResend: options?.resendSms ? 'Y' : 'N',
    targetCount: targets.length,
    targets,
    refKey: generateRefKey(),
  }

  if (options?.sendTime) {
    requestBody.sendTime = options.sendTime
  }

  if (options?.resendSms) {
    requestBody.resend = {
      messageType: 'SMS',
      content: options.resendSms.content,
      from: options.resendSms.from,
    }
  }

  console.log('[Ppurio] Sending alimtalk:', {
    templateCode,
    targetCount: targets.length,
    targets: targets.map(t => ({ to: t.to.slice(0, 7) + '****' })), // 번호 마스킹
  })

  const response = await fetch(`${PPURIO_BASE_URL}/v1/kakao`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...relayHeaders(),
    },
    body: JSON.stringify(requestBody),
  })

  const raw = await response.text()
  let data: KakaoSendResponse
  try {
    data = JSON.parse(raw)
  } catch {
    console.error('[Ppurio] Non-JSON response:', response.status, raw.slice(0, 200))
    throw new Error(`알림톡 발송 실패(${response.status}): 릴레이 또는 뿌리오 응답 오류`)
  }

  console.log('[Ppurio] Response:', data)

  // code가 문자열 또는 숫자로 올 수 있음
  const responseCode = String(data.code)
  if (responseCode !== '1000') {
    console.error('[Ppurio] Send error:', data)
    throw new Error(`알림톡 발송 실패: ${data.description}`)
  }

  console.log('[Ppurio] Send success:', { messageKey: data.messageKey, refKey: data.refKey })

  return data
}

/**
 * 단일 수신자 알림톡 발송 헬퍼
 */
export async function sendAlimtalkToOne(
  templateCode: string,
  phoneNumber: string,
  variables?: {
    name?: string
    var1?: string
    var2?: string
    var3?: string
    var4?: string
    var5?: string
    var6?: string
    var7?: string
    var8?: string
  }
): Promise<KakaoSendResponse> {
  const target: KakaoSendTarget = {
    to: phoneNumber.replace(/-/g, ''), // 하이픈 제거
  }

  if (variables?.name) {
    target.name = variables.name
  }

  const changeWord: KakaoSendTarget['changeWord'] = {}
  if (variables?.var1) changeWord.var1 = variables.var1
  if (variables?.var2) changeWord.var2 = variables.var2
  if (variables?.var3) changeWord.var3 = variables.var3
  if (variables?.var4) changeWord.var4 = variables.var4
  if (variables?.var5) changeWord.var5 = variables.var5
  if (variables?.var6) changeWord.var6 = variables.var6
  if (variables?.var7) changeWord.var7 = variables.var7
  if (variables?.var8) changeWord.var8 = variables.var8

  if (Object.keys(changeWord).length > 0) {
    target.changeWord = changeWord
  }

  return sendKakaoAlimtalk(templateCode, [target])
}
