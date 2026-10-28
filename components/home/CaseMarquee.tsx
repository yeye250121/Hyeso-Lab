'use client'

import { useEffect, useRef, useState } from 'react'
import type { GiftCase } from '@/components/landing/PartnerLanding'

// 지원금 지급 사례. 카드가 옆으로 계속 흐른다(모요 후기처럼). 손가락을 대면 잠깐 멈춘다.
export default function CaseMarquee({ cases, title = '지원금 지급 사례', subtitle = '설치 후 계좌로 들어간 금액이에요.', className = '' }: { cases: GiftCase[]; title?: string; subtitle?: string; className?: string }) {
  const [paused, setPaused] = useState(false)
  const [started, setStarted] = useState(false) // 화면에 들어온 뒤부터 흐른다(처음 카드가 잘려 보이지 않게)
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStarted(true); io.disconnect() } }, { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const items = [...cases, ...cases] // 절반 이동으로 끊김 없이 이어진다
  return (
    <section ref={ref} className={`bg-[#f9fafb] py-16 overflow-hidden ${className}`} data-testid="landing-cases">
      <div className="px-6">
        <h2 className="text-[18px] font-semibold tracking-[-0.02em]">{title}</h2>
        <p className="mt-1 text-[13px] text-[#8b95a1]">{subtitle}</p>
      </div>
      <div className="mt-5" onTouchStart={() => setPaused(true)} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <ul className={`flex gap-3 w-max pl-6 ${started ? 'landing-marquee' : ''} ${paused ? 'is-paused' : ''}`} style={{ ['--marquee-duration' as string]: `${cases.length * 6}s` }}>
          {items.map((c, i) => (
            <li key={i} className="w-[220px] shrink-0 rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]" data-testid="landing-case">
              <p className="text-[12px] text-[#8b95a1]">{c.name}{c.region ? ` · ${c.region}` : ''}</p>
              <p className="mt-1 text-[14px] font-medium text-[#333d4b] truncate">{c.product}</p>
              <p className="mt-2.5 text-[18px] font-semibold tabular-nums text-[var(--action-primary)]">{c.amount.toLocaleString('ko-KR')}원</p>
              <p className="mt-0.5 text-[11px] text-[#b0b8c1]">{c.date ? `${c.date.replace(/-/g, '.')} 지급` : '설치 후 지급'}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
