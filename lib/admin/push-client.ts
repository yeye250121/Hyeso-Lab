import api from '@/lib/admin/api'

// 앱 푸시 토큰의 브라우저 쪽 보관. PushRegistrar 가 저장하고, 로그아웃 때 서버에서 지운다.
export const PUSH_TOKEN_KEY = 'hyeso-push-token'

export function rememberPushToken(token: string) {
  try { localStorage.setItem(PUSH_TOKEN_KEY, token) } catch {}
}

/** 로그아웃 직전: 이 기기 토큰을 서버에서 지워 다음 사람이 남의 알림을 받지 않게 한다 */
export async function unregisterPushToken() {
  let token: string | null = null
  try { token = localStorage.getItem(PUSH_TOKEN_KEY) } catch {}
  if (!token) return
  try {
    await api.delete('/admin/push/register', { data: { token } })
    localStorage.removeItem(PUSH_TOKEN_KEY)
  } catch {}
}
