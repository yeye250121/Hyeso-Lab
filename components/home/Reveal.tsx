'use client'

import { useEffect, useRef, useState, createElement } from 'react'

// 스크롤 등장(CSS 트랜지션, framer 없음). SSR 결과는 항상 보이는 상태로 나가고,
// JS 가 붙은 뒤 "아직 화면 밖"인 요소만 숨겼다가 들어올 때 올린다 → 투명한 채 남는 요소가 없다.
export default function Reveal({ children, delay = 0, className = '', as = 'div' }: { children: React.ReactNode; delay?: number; className?: string; as?: 'div' | 'li' | 'section' }) {
  const ref = useRef<HTMLElement>(null)
  const [state, setState] = useState<'ssr' | 'hidden' | 'show'>('ssr')
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return
    setState('hidden')
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setState('show'); io.disconnect() } }, { threshold: 0, rootMargin: '0px 0px -12% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const style: React.CSSProperties = state === 'hidden'
    ? { opacity: 0, transform: 'translateY(18px)', transition: 'none' }
    : state === 'show'
      ? { opacity: 1, transform: 'none', transition: `opacity 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s` }
      : {}
  return createElement(as, { ref, className, style }, children)
}
