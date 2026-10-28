'use client'

import { useEffect, useRef, useState } from 'react'

// 화면에 들어오면 0 → 목표로 올라가는 숫자. reduced-motion 이면 바로 목표값.
export default function CountUp({ to, duration = 1400, delay = 0, format = (n: number) => n.toLocaleString('ko-KR'), start }: { to: number; duration?: number; delay?: number; format?: (n: number) => string; start?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [v, setV] = useState(to)
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setV(0)
    setArmed(true)
  }, [])
  useEffect(() => {
    if (!armed) return
    const el = ref.current
    if (!el) return
    let raf = 0
    const run = () => {
      const t0 = performance.now() + delay
      const tick = (t: number) => {
        const p = Math.min(1, Math.max(0, (t - t0) / duration))
        setV(Math.round(to * (1 - Math.pow(1 - p, 4))))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }
    if (start !== undefined) { if (start) run(); return () => cancelAnimationFrame(raf) }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); run() } }, { threshold: 0.5 })
    io.observe(el)
    return () => { io.disconnect(); cancelAnimationFrame(raf) }
  }, [armed, to, duration, delay, start])
  return <span ref={ref} className="tabular-nums">{format(v)}</span>
}
