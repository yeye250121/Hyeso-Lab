'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { EASE } from './motion'

// 스크롤 등장. SSR 결과는 항상 보이는 상태로 나가고, JS 가 붙은 뒤 "아직 화면 밖"인 요소만 숨겼다가 들어올 때 올린다.
// → JS 지연·빠른 스크롤·reduced-motion 어느 경우에도 투명한 채 남는 요소가 없다.
export default function Reveal({ children, delay = 0, className = '', as = 'div' }: { children: React.ReactNode; delay?: number; className?: string; as?: 'div' | 'li' | 'section' }) {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'ssr' | 'hidden' | 'show'>('ssr')
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return
    setState('hidden')
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setState('show'); io.disconnect() } }, { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const M = (motion as unknown as Record<string, typeof motion.div>)[as] ?? motion.div
  return (
    <M ref={ref} className={className} initial={false} animate={state === 'hidden' ? { opacity: 0, y: 18 } : { opacity: 1, y: 0 }} transition={state === 'hidden' ? { duration: 0 } : { duration: 0.6, ease: EASE, delay }}>
      {children}
    </M>
  )
}
