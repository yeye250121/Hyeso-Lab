'use client'

import { useEffect, useRef } from 'react'

const STORAGE_BASE =
  'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/public/HYESO-LAB/videos'

// poster 는 영상의 첫 프레임과 동일하다. 정지 → 재생 전환이 눈에 띄지 않는다.
const POSTER_URL = `${STORAGE_BASE}/hyeso-lab_hero_v2_poster.webp`
const DESKTOP_SRC = `${STORAGE_BASE}/hyeso-lab_hero_v2_720p.mp4`
const MOBILE_SRC = `${STORAGE_BASE}/hyeso-lab_hero_v2_480p.mp4`

const MOBILE_QUERY = '(max-width: 768px)'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // 모션 최소화를 설정한 사용자에게는 poster 만 남긴다.
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return

    let cancelled = false

    const startLoading = () => {
      if (cancelled) return
      // <source media="..."> 는 <video> 안에서 브라우저 지원이 불안정하므로
      // 소스 선택을 직접 한다.
      video.src = window.matchMedia(MOBILE_QUERY).matches ? MOBILE_SRC : DESKTOP_SRC
      video.load()
      video.play().catch(() => {
        // 자동재생이 차단되면 poster 가 그대로 남는다.
      })
    }

    // poster 와 나머지 초기 리소스가 자리를 잡은 뒤에 영상을 받는다.
    const supportsIdle = typeof window.requestIdleCallback === 'function'
    const handle = supportsIdle
      ? window.requestIdleCallback(startLoading, { timeout: 2000 })
      : window.setTimeout(startLoading, 300)

    return () => {
      cancelled = true
      if (supportsIdle) window.cancelIdleCallback(handle)
      else window.clearTimeout(handle)
    }
  }, [])

  return (
    <video
      ref={videoRef}
      poster={POSTER_URL}
      autoPlay
      loop
      muted
      playsInline
      preload="none"
      aria-hidden="true"
      className="absolute top-0 left-0 w-full h-[133.33%] object-cover object-top opacity-80 pointer-events-none"
    />
  )
}
