'use client'

import Link from 'next/link'
import MoneyFlow from './MoneyFlow'
import { PROMISES } from '@/lib/content/promise'

// 4.1 히어로 — "여기는 뭐가 다른데?" 헤드라인은 기존 카피 유지, 서브에서 즉시 차별화.
export default function Hero({ maxGift }: { maxGift: number }) {
  return (
    <section className="pt-[60px]" id="top">
      <div className="max-w-[1040px] mx-auto px-5 lg:px-8 pt-14 pb-16 lg:pt-28 lg:pb-32 grid lg:grid-cols-[1fr_440px] gap-12 lg:gap-14 items-center">
        <div>
          <h1 className="text-[26px] leading-[1.3] sm:text-[34px] lg:text-[42px] lg:leading-[1.25] font-semibold tracking-[-0.02em] text-[#191f28] break-keep">
            놓치고 있던 혜택,
            <br />
            대신 알아볼게요
          </h1>
          <p className="mt-4 lg:mt-5 text-[15px] lg:text-[16px] leading-relaxed text-[#6b7684] break-keep">
            혜택연구소에서 똑똑하게 알아봐요
          </p>
          <div className="mt-8 lg:mt-10">
            <Link href="/apply" data-testid="hero-cta" className="inline-flex items-center justify-center gap-2 w-full sm:w-auto h-14 px-7 rounded-2xl bg-[#ff8fab] hover:bg-[#ff7096] text-white text-[15px] font-semibold transition-colors">
              연구 시작하기
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-2" aria-label="세 가지 약속">
            {PROMISES.map((p) => (
              <li key={p.key}>
                <a href="#promises" className="inline-flex items-center h-8 px-3 rounded-full bg-[#f2f4f6] text-[13px] font-medium text-[#4e5968] hover:bg-[#e5e8eb]">{p.chip}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <MoneyFlow maxGift={maxGift} />
          <p className="mt-3 text-center text-[12px] text-[#6b7684]">동일 상품 · 약정 · 관리 조건 기준</p>
        </div>
      </div>
    </section>
  )
}
