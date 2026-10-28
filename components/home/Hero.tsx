'use client'

import Link from 'next/link'
import MoneyFlow from './MoneyFlow'
import { PROMISES } from '@/lib/content/promise'

// 4.1 히어로 — 헤드라인은 기존 카피 유지.
// 모바일: 제목·서브 가운데 정렬 → 그래프 → 버튼·칩(그래프 아래). 데스크톱: 왼쪽 텍스트+버튼, 오른쪽 그래프.
export default function Hero({ maxGift }: { maxGift: number }) {
  // 같은 버튼이 데스크톱·모바일 자리에 하나씩 들어간다. 하단 고정 바와 테스트는 모바일 쪽(hero-cta)을 본다.
  const cta = (id: string) => (
    <Link href="/apply" data-testid={id} className="inline-flex items-center justify-center w-full sm:w-auto h-14 px-7 rounded-2xl bg-[#ff8fab] hover:bg-[#ff7096] text-white text-[15px] font-semibold transition-colors">
      연구 시작하기
    </Link>
  )
  const chips = (
    <ul className="flex flex-wrap justify-center lg:justify-start gap-2" aria-label="세 가지 약속">
      {PROMISES.map((p) => (
        <li key={p.key}>
          <a href="#promises" className="inline-flex items-center h-8 px-3 rounded-full bg-[#f2f4f6] text-[13px] font-medium text-[#4e5968] hover:bg-[#e5e8eb]">{p.chip}</a>
        </li>
      ))}
    </ul>
  )
  return (
    <section className="pt-[60px]" id="top">
      <div className="max-w-[1040px] mx-auto px-6 lg:px-8 pt-16 pb-20 lg:pt-28 lg:pb-32 grid lg:grid-cols-[1fr_440px] gap-10 lg:gap-14 items-center">
        <div className="text-center lg:text-left">
          <h1 className="text-[26px] leading-[1.3] sm:text-[34px] lg:text-[42px] lg:leading-[1.25] font-semibold tracking-[-0.02em] text-[#191f28] break-keep">
            놓치고 있던 혜택,
            <br />
            대신 알아볼게요
          </h1>
          <p className="mt-4 lg:mt-5 text-[15px] lg:text-[16px] leading-relaxed text-[#6b7684] break-keep">혜택연구소에서 똑똑하게 알아봐요</p>
          {/* 데스크톱에서만 텍스트 아래 버튼·칩 */}
          <div className="hidden lg:block mt-10">{cta('hero-cta-desktop')}</div>
          <div className="hidden lg:block mt-8">{chips}</div>
        </div>
        <div className="px-2 sm:px-6 lg:px-0">
          <MoneyFlow maxGift={maxGift} />
          <p className="mt-3 text-center text-[12px] text-[#6b7684]">동일 상품 · 약정 · 관리 조건 기준</p>
        </div>
        {/* 모바일에서는 그래프 아래 버튼·칩 */}
        <div className="lg:hidden -mt-2">
          {cta('hero-cta')}
          <div className="mt-6">{chips}</div>
        </div>
      </div>
    </section>
  )
}
