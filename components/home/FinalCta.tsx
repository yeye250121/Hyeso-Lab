'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Reveal from './Reveal'

// 4.8 마지막 CTA + 모바일 하단 고정 바.
// 바는 히어로 CTA 가 화면 위로 지나간 뒤 나타나고, 마지막 CTA 섹션의 버튼 자리(슬롯)와 만나면
// 거기에 "도킹"해서 섹션 버튼 하나로 합쳐진다(고정 → 섹션 안 절대 위치). 다시 올라오면 풀린다.
const BAR_PT = 12 // pt-3

export function MobileCtaBar() {
  const [show, setShow] = useState(false)
  const [dockTop, setDockTop] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const hero = document.querySelector('[data-testid="hero-cta"]')
    if (!hero) return
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.bottom < 0))
    io.observe(hero)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const slot = document.querySelector<HTMLElement>('[data-testid="final-cta-slot"]')
    const bar = ref.current
    if (!slot || !bar) return
    slot.dataset.js = '1' // JS 가 붙었으니 슬롯 안 링크는 숨기고 바가 그 자리를 맡는다(globals.css)
    let raf = 0
    const update = () => {
      raf = 0
      if (window.matchMedia('(min-width: 1024px)').matches) return setDockTop(null)
      const r = slot.getBoundingClientRect()
      // 고정 상태일 때 바 안 버튼의 화면 상단 y. 슬롯이 그보다 위로 올라오면 도킹.
      const fixedBtnTop = window.innerHeight - bar.offsetHeight + BAR_PT
      if (r.top <= fixedBtnTop) {
        // fixed 상태에선 offsetParent 가 없으니, 절대 위치 기준이 될 부모(.home-root, relative)를 직접 잰다
        const rootTop = bar.parentElement?.getBoundingClientRect().top ?? 0
        setDockTop(r.top - rootTop - BAR_PT)
      } else setDockTop(null)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (raf) cancelAnimationFrame(raf) }
  }, [])

  const docked = dockTop !== null
  return (
    <div
      ref={ref}
      data-testid="mobile-cta"
      data-docked={docked ? 'true' : 'false'}
      style={docked ? { position: 'absolute', top: dockTop, bottom: 'auto' } : undefined}
      className={`lg:hidden fixed bottom-0 inset-x-0 z-40 px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 transition-transform duration-300 ${show || docked ? 'translate-y-0' : 'translate-y-full'}`}
    >
      {/* 고정 상태에서만 깔리는 흰 그라데이션. 도킹하면 사라진다 */}
      <div aria-hidden className={`absolute inset-0 -z-10 bg-gradient-to-t from-white via-white/95 to-transparent transition-opacity duration-200 ${docked ? 'opacity-0' : 'opacity-100'}`} />
      <Link href="/apply" className={`flex items-center justify-center h-14 rounded-2xl bg-[#ff8fab] text-white text-[15px] font-semibold transition-shadow duration-300 ${docked ? 'shadow-none' : 'shadow-[0_8px_24px_rgba(255,143,171,0.3)]'}`}>연구 시작하기</Link>
    </div>
  )
}

export default function FinalCta() {
  return (
    <section className="max-w-[1200px] mx-auto px-5 lg:px-8 py-24 lg:py-40 text-center">
      <Reveal>
        <h2 className="text-[24px] lg:text-[36px] font-semibold tracking-[-0.02em] leading-[1.3] text-[#191f28] break-keep">놓치고 있던 혜택,<br />지금 알아봐요</h2>
        {/* 모바일: 하단 고정 바가 내려와 이 자리에 도킹한다(JS 전에는 슬롯 안 링크가 그대로 보인다). 데스크톱: 보통 버튼 */}
        <div className="mt-8 lg:mt-10 h-14 lg:h-auto" data-testid="final-cta-slot">
          <Link href="/apply" className="inline-flex items-center justify-center w-full sm:w-auto h-14 px-7 rounded-2xl bg-[#ff8fab] hover:bg-[#ff7096] text-white text-[15px] font-semibold transition-colors">
            연구 시작하기
          </Link>
        </div>
      </Reveal>
    </section>
  )
}
