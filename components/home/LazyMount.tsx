'use client'

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'

// 화면 근처(기본 600px 전)에 올 때 모듈을 그때 import 해서 마운트한다. 그 전엔 fallback(서버가 그린 정적 내용).
// next/dynamic 을 쓰지 않는 이유: 공유 청크(framer-motion)가 페이지 초기 스크립트에 끼어 들어가는 것을 막기 위해
// 순수 import() 만 쓴다 → 스크롤 전에는 요청 자체가 없다. JS 가 늦어도 fallback 이 읽을 수 있는 최종 상태다.
export default function LazyMount<P extends object>({ load, props, fallback, rootMargin = '200px' }: { load: () => Promise<{ default: ComponentType<P> }>; props: P; fallback: ReactNode; rootMargin?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [C, setC] = useState<ComponentType<P> | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let cancelled = false
    // 첫 화면 하이드레이션이 끝난 뒤(유휴 시점)에 받는다 → 모션 청크 실행이 초기 블로킹 시간에 안 잡힌다
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }
    const idle = (fn: () => void) => (typeof w.requestIdleCallback === 'function' ? w.requestIdleCallback(fn, { timeout: 2500 }) : window.setTimeout(fn, 600))
    const go = () => idle(() => load().then((m) => { if (!cancelled) setC(() => m.default) }))
    if (el.getBoundingClientRect().top < window.innerHeight + 200) { go(); return () => { cancelled = true } }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); go() } }, { rootMargin })
    io.observe(el)
    return () => { cancelled = true; io.disconnect() }
  }, [load, rootMargin])
  return <div ref={ref}>{C ? <C {...props} /> : fallback}</div>
}
