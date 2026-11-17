import { JWT } from 'google-auth-library'
import type { PushMessage, PushOutcome } from './apns'

// Android 푸시: FCM HTTP v1. 파이어베이스 서비스 계정 JSON 으로 OAuth 토큰을 받아 보낸다.
// 필요한 env: FCM_SERVICE_ACCOUNT_JSON(서비스 계정 키 파일 내용 그대로, 또는 base64). project_id 는 그 안에 있다.

type ServiceAccount = { project_id: string; client_email: string; private_key: string }

let account: ServiceAccount | null | undefined
function serviceAccount(): ServiceAccount | null {
  if (account !== undefined) return account
  const raw = process.env.FCM_SERVICE_ACCOUNT_JSON ?? ''
  if (!raw) return (account = null)
  try {
    const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8')
    const j = JSON.parse(text) as ServiceAccount
    account = j.project_id && j.client_email && j.private_key ? { ...j, private_key: j.private_key.replace(/\\n/g, '\n') } : null
  } catch {
    account = null
  }
  return account
}

export function fcmConfigured(): boolean {
  return serviceAccount() !== null
}

let client: JWT | null = null
async function accessToken(): Promise<string> {
  const sa = serviceAccount()
  if (!sa) throw new Error('fcm not configured')
  client ??= new JWT({ email: sa.client_email, key: sa.private_key, scopes: ['https://www.googleapis.com/auth/firebase.messaging'] })
  const { token } = await client.getAccessToken()
  if (!token) throw new Error('fcm token failed')
  return token
}

export function fcmPayload(deviceToken: string, msg: PushMessage) {
  return {
    message: {
      token: deviceToken,
      notification: { title: msg.title, body: msg.body },
      data: { url: msg.url ?? '' },
      android: { priority: 'HIGH', notification: { sound: 'default', click_action: 'FCM_PLUGIN_ACTIVITY' } },
    },
  }
}

export async function sendFcm(deviceToken: string, msg: PushMessage): Promise<PushOutcome> {
  const sa = serviceAccount()
  if (!sa) return { ok: false, reason: 'fcm not configured' }
  try {
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
      method: 'POST',
      headers: { authorization: `Bearer ${await accessToken()}`, 'content-type': 'application/json' },
      body: JSON.stringify(fcmPayload(deviceToken, msg)),
      signal: AbortSignal.timeout(10_000),
    })
    if (res.ok) return { ok: true, status: res.status }
    const text = await res.text()
    const code = (() => { try { return JSON.parse(text).error?.details?.[0]?.errorCode ?? JSON.parse(text).error?.status ?? '' } catch { return '' } })()
    return { ok: false, status: res.status, reason: code || text.slice(0, 80), dead: res.status === 404 || code === 'UNREGISTERED' }
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) }
  }
}
