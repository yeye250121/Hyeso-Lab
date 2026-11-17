'use client'

import { useEffect } from 'react'

// Capacitor 앱(웹뷰) 안에서만 도는 보정. 브라우저에서는 아무것도 하지 않는다.
// 네이티브 브리지는 server.url 로 불러온 페이지에도 주입되므로 window.Capacitor 로 판별하고,
// 플러그인 JS 는 그때만 받아 일반 방문자의 번들에는 영향이 없다.
type Cap = { isNativePlatform?: () => boolean; getPlatform?: () => string }

export default function NativeShell() {
  useEffect(() => {
    const cap = (window as unknown as { Capacitor?: Cap }).Capacitor
    if (!cap?.isNativePlatform?.()) return
    const platform = cap.getPlatform?.() ?? 'native'
    document.documentElement.dataset.native = platform
    ;(async () => {
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar')
        await StatusBar.setStyle({ style: Style.Light }) // 흰 배경 + 어두운 아이콘
        if (platform === 'android') await StatusBar.setBackgroundColor({ color: '#ffffff' })
      } catch {}
      try {
        const { SplashScreen } = await import('@capacitor/splash-screen')
        await SplashScreen.hide()
      } catch {}
    })()
  }, [])
  return null
}
