'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Reveal from './Reveal'

// 4.8 마지막 CTA + 모바일 하단 고정 바(히어로 CTA 가 화면 밖일 때만).
export function MobileCtaBar() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const hero = document.querySelector('[data-testid="hero-cta"]')
    if (!hero) return
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0))
    io.observe(hero)
    return () => io.disconnect()
  }, [])
  return (
    <div className={`lg:hidden fixed bottom-0 inset-x-0 z-40 px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-white via-white/95 to-transparent transition-transform duration-300 ${show ? 'translate-y-0' : 'translate-y-full'}`} data-testid="mobile-cta">
      <Link href="/apply" className="flex items-center justify-center gap-2 h-[52px] rounded-2xl bg-[#ff8fab] text-[#191f28] text-[16px] font-semibold shadow-[0_8px_24px_rgba(255,143,171,0.3)]">내 사은품 확인하기 <ArrowRight className="w-4 h-4" /></Link>
    </div>
  )
}

export default function FinalCta() {
  return (
    <section className="max-w-[1200px] mx-auto px-5 lg:px-8 py-24 lg:py-40 text-center">
      <Reveal>
        <h2 className="text-[30px] lg:text-[56px] font-bold tracking-[-0.03em] leading-[1.15] text-[#191f28] break-keep">놓치고 있던 혜택,<br />지금 알아봐요</h2>
        <Link href="/apply" className="mt-8 lg:mt-10 inline-flex items-center justify-center gap-2 h-14 px-8 rounded-2xl bg-[#ff8fab] hover:bg-[#ff7096] text-[#191f28] text-[16px] font-semibold transition-colors">
          내 사은품 확인하기 <ArrowRight className="w-4 h-4" />
        </Link>
      </Reveal>
    </section>
  )
}
