'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// 공개 페이지 방문을 /api/pv 로 보낸다. 경로가 바뀔 때마다 한 번. 콘솔·명세서는 서버가 걸러낸다.
const INTERNAL = /^\/(owner|admin|partners|s)(\/|$)/

export default function PageViewTracker() {
  const pathname = usePathname()
  const search = useSearchParams()
  const last = useRef<string>('')

  useEffect(() => {
    if (!pathname || INTERNAL.test(pathname) || pathname === last.current) return
    last.current = pathname
    if (typeof navigator !== 'undefined' && (navigator as Navigator & { webdriver?: boolean }).webdriver) return
    const utm = {
      source: search.get('utm_source') ?? undefined,
      medium: search.get('utm_medium') ?? undefined,
      campaign: search.get('utm_campaign') ?? undefined,
    }
    const m = document.cookie.match(/(?:^|;\s*)hl_m=([^;]+)/)
    const body = JSON.stringify({ path: pathname, referrer: document.referrer || null, utm, marketerCode: m ? decodeURIComponent(m[1]) : search.get('m') })
    // keepalive: 페이지를 바로 떠나도 전송이 끊기지 않는다
    fetch('/api/pv', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true, credentials: 'same-origin' }).catch(() => {})
  }, [pathname, search])

  return null
}
