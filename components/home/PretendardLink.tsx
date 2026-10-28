'use client'

import { useEffect } from 'react'

const HREF = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css'

// 렌더 차단 없이 폰트 CSS 를 붙인다. SSR 단계에서는 preconnect 만 나가고, 클라이언트에서 stylesheet 를 추가한다.
export default function PretendardLink() {
  useEffect(() => {
    if (document.querySelector(`link[href="${HREF}"]`)) return
    const l = document.createElement('link')
    l.rel = 'stylesheet'
    l.href = HREF
    document.head.appendChild(l)
  }, [])
  return (
    <>
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
    </>
  )
}
