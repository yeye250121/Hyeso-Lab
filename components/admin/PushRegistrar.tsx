'use client'

import { useEffect } from 'react'
import api from '@/lib/admin/api'
import { rememberPushToken } from '@/lib/admin/push-client'

// 앱(Capacitor) 안에서 콘솔에 로그인했을 때 푸시 권한을 묻고 기기 토큰을 서버에 등록한다.
// 브라우저에서는 아무것도 하지 않는다. 알림을 누르면 payload 의 url 로 이동한다.
let started = false

type Cap = { isNativePlatform?: () => boolean; getPlatform?: () => string }

export default function PushRegistrar() {
  useEffect(() => {
    const cap = (window as unknown as { Capacitor?: Cap }).Capacitor
    if (!cap?.isNativePlatform?.() || started) return
    started = true
    const platform = cap.getPlatform?.() === 'ios' ? 'ios' : 'android'
    ;(async () => {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications')
        await PushNotifications.addListener('registration', async ({ value }) => {
          try {
            await api.post('/admin/push/register', { token: value, platform })
            rememberPushToken(value)
          } catch (e) {
            console.warn('[Push] 토큰 등록 실패', e)
          }
        })
        await PushNotifications.addListener('registrationError', (e) => console.warn('[Push] 등록 오류', e))
        await PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
          const url = (notification.data as { url?: string } | undefined)?.url
          if (url && url.startsWith('/')) window.location.assign(url)
        })
        let { receive } = await PushNotifications.checkPermissions()
        if (receive === 'prompt' || receive === 'prompt-with-rationale') ({ receive } = await PushNotifications.requestPermissions())
        if (receive === 'granted') await PushNotifications.register()
      } catch (e) {
        console.warn('[Push] 초기화 실패', e)
      }
    })()
  }, [])
  return null
}
