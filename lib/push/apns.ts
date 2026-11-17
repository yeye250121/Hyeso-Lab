import { createPrivateKey, sign } from 'crypto'
import http2 from 'http2'

// iOS 푸시: APNs HTTP/2 에 직접 보낸다(파이어베이스 없이). 인증은 .p8 키로 만든 ES256 JWT.
// 필요한 env: APNS_TEAM_ID, APNS_KEY_ID, APNS_KEY_P8(PEM, 줄바꿈은 \n 문자열이어도 됨), APNS_BUNDLE_ID(기본 kr.hyeso.app)
// APNS_ENV=sandbox 면 개발 빌드(Xcode 직접 설치) 토큰용 샌드박스 서버를 쓴다. 기본은 production(TestFlight·앱스토어).

export type PushMessage = { title: string; body: string; url?: string }
export type PushOutcome = { ok: boolean; status?: number; reason?: string; dead?: boolean }

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

export function apnsConfigured(): boolean {
  return Boolean(process.env.APNS_TEAM_ID && process.env.APNS_KEY_ID && process.env.APNS_KEY_P8)
}

let cachedJwt: { token: string; issuedAt: number } | null = null

/** APNs 는 토큰 발급 후 20~60분 사이 재발급을 요구한다. 50분마다 새로 만든다 */
export function apnsJwt(now = Date.now()): string {
  if (cachedJwt && now - cachedJwt.issuedAt < 50 * 60 * 1000) return cachedJwt.token
  const pem = (process.env.APNS_KEY_P8 ?? '').replace(/\\n/g, '\n')
  const key = createPrivateKey(pem)
  const header = b64url(JSON.stringify({ alg: 'ES256', kid: process.env.APNS_KEY_ID }))
  const claims = b64url(JSON.stringify({ iss: process.env.APNS_TEAM_ID, iat: Math.floor(now / 1000) }))
  const signature = sign('sha256', Buffer.from(`${header}.${claims}`), { key, dsaEncoding: 'ieee-p1363' })
  const token = `${header}.${claims}.${b64url(signature)}`
  cachedJwt = { token, issuedAt: now }
  return token
}

export function apnsPayload(msg: PushMessage) {
  return { aps: { alert: { title: msg.title, body: msg.body }, sound: 'default' }, url: msg.url ?? '' }
}

function post(host: string, deviceToken: string, body: string): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const session = http2.connect(`https://${host}`)
    const timer = setTimeout(() => { session.close(); reject(new Error('APNs timeout')) }, 10_000)
    session.on('error', (e) => { clearTimeout(timer); reject(e) })
    const req = session.request({
      ':method': 'POST',
      ':path': `/3/device/${deviceToken}`,
      authorization: `bearer ${apnsJwt()}`,
      'apns-topic': process.env.APNS_BUNDLE_ID || 'kr.hyeso.app',
      'apns-push-type': 'alert',
      'apns-priority': '10',
      'content-type': 'application/json',
    })
    let status = 0
    const chunks: Buffer[] = []
    req.on('response', (h) => { status = Number(h[':status'] ?? 0) })
    req.on('data', (c: Buffer) => chunks.push(c))
    req.on('end', () => { clearTimeout(timer); session.close(); resolve({ status, text: Buffer.concat(chunks).toString('utf8') }) })
    req.on('error', (e) => { clearTimeout(timer); session.close(); reject(e) })
    req.end(body)
  })
}

export async function sendApns(deviceToken: string, msg: PushMessage): Promise<PushOutcome> {
  if (!apnsConfigured()) return { ok: false, reason: 'apns not configured' }
  const body = JSON.stringify(apnsPayload(msg))
  const hosts = process.env.APNS_ENV === 'sandbox' ? ['api.sandbox.push.apple.com'] : ['api.push.apple.com', 'api.sandbox.push.apple.com']
  let last: PushOutcome = { ok: false, reason: 'no attempt' }
  for (const host of hosts) {
    try {
      const { status, text } = await post(host, deviceToken, body)
      if (status === 200) return { ok: true, status }
      let reason = ''
      try { reason = JSON.parse(text).reason ?? '' } catch { reason = text.slice(0, 80) }
      // 개발 빌드 토큰을 운영 서버로 보내면 BadDeviceToken → 샌드박스로 한 번 더
      last = { ok: false, status, reason, dead: status === 410 || reason === 'Unregistered' }
      if (reason !== 'BadDeviceToken') return last
    } catch (e) {
      last = { ok: false, reason: e instanceof Error ? e.message : String(e) }
      return last
    }
  }
  // 양쪽 모두 BadDeviceToken 이면 이 기기 토큰은 더 못 쓴다
  return { ...last, dead: true }
}
