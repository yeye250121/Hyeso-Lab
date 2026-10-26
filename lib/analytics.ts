'use client'

import { track } from '@vercel/analytics'

// 사이트 이벤트 수집. Vercel Web Analytics 와 GA4(설정돼 있을 때) 양쪽에 같은 이름으로 보낸다.
// 페이지뷰는 각 도구가 알아서 잡고, 여기서는 "전환"에 해당하는 행동만 이름 붙여 보낸다.
//   lead_submit        상담 신청(번호) 접수      { service, source: 'apply' | 'landing', partner? }
//   application_submit 신청서 작성 완료           { service }
//   landing_gift_reveal 랜딩에서 지원금 확인하기   { carrier }
type Params = Record<string, string | number | boolean | null | undefined>

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function trackEvent(name: string, params: Params = {}) {
  const clean: Record<string, string | number | boolean> = {}
  for (const [k, v] of Object.entries(params)) if (v !== null && v !== undefined) clean[k] = v
  try {
    track(name, clean)
  } catch {
    /* 분석 실패가 화면을 막으면 안 된다 */
  }
  try {
    window.gtag?.('event', name, clean)
  } catch {
    /* ignore */
  }
}
