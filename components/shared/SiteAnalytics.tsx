'use client'

import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'

// 트래픽 수집. Vercel Web Analytics 는 항상, GA4 는 측정 ID(NEXT_PUBLIC_GA_ID)가 있을 때만 붙는다.
// 관리자 콘솔(/owner·/admin·/partners)과 담당자 명세서(/s)는 분석에서 뺀다 — 내부 트래픽이 섞이면 수치가 흐려진다.
const INTERNAL = /^\/(owner|admin|partners|s)(\/|$)/

export default function SiteAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  return (
    <>
      <Analytics beforeSend={(e) => (INTERNAL.test(new URL(e.url).pathname) ? null : e)} />
      {gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="lazyOnload" />
          <Script id="ga4-init" strategy="lazyOnload">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${gaId}');`}</Script>
        </>
      )}
    </>
  )
}
