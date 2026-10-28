'use client'

import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'
import { PROMISES } from '@/lib/content/promise'
import CountUp from './CountUp'
import Reveal from './Reveal'
import { EASE } from './motion'

// 4.2 세 가지 약속 — 데스크톱은 왼쪽 sticky 제목, 오른쪽 패널이 스크롤에 따라 교체. 모바일은 세로 나열.
const won = (n: number) => n.toLocaleString('ko-KR')

function MatchVisual({ active }: { active: boolean }) {
  const other = 500000, ours = 450000
  const diff = other - ours, bonus = Math.round(diff * 1.2)
  return (
    <div className="rounded-[20px] bg-[#f9fafb] p-6 lg:p-8" aria-label="차액 120% 보상 예시 계산">
      <p className="text-[12px] text-[#8b95a1]">예시 · 같은 조건에서</p>
      <dl className="mt-4 space-y-3 text-[15px]">
        <div className="flex justify-between"><dt className="text-[#6b7684]">다른 곳 사은품</dt><dd className="font-medium text-[#191f28] tabular-nums">{won(other)}원</dd></div>
        <div className="flex justify-between"><dt className="text-[#6b7684]">혜택연구소 사은품</dt><dd className="font-medium text-[#191f28] tabular-nums">{won(ours)}원</dd></div>
        <div className="flex justify-between border-t border-[#e5e8eb] pt-3"><dt className="text-[#6b7684]">차액 × 120%</dt><dd className="font-semibold text-[#ff5c8a] tabular-nums">+ <CountUp to={bonus} start={active} duration={900} />원</dd></div>
      </dl>
      <p className="mt-5 text-[12px] text-[#8b95a1]">결과: 혜택연구소에서 받는 사은품</p>
      <p className="mt-1 text-[26px] lg:text-[30px] font-semibold tracking-[-0.02em] text-[#191f28] tabular-nums"><CountUp to={ours + bonus} start={active} duration={1100} />원</p>
    </div>
  )
}

function CashVisual({ active }: { active: boolean }) {
  const reduce = useReducedMotion()
  const items = ['설치 완료', '설치 확인', '계좌 입금']
  return (
    <div className="rounded-[20px] bg-[#f9fafb] p-6 lg:p-8" aria-label="설치 당일 현금 입금 타임라인">
      <p className="text-[12px] text-[#8b95a1]">설치 당일</p>
      <div className="relative mt-6">
        <div className="absolute left-3 right-3 top-3 h-[2px] bg-[#e5e8eb]" />
        <motion.div className="absolute left-3 top-3 h-[2px] bg-[#ff8fab] origin-left" style={{ right: 12 }} initial={{ scaleX: reduce ? 1 : 0 }} animate={{ scaleX: active || reduce ? 1 : 0 }} transition={{ duration: 1.2, ease: EASE, delay: 0.2 }} />
        <ol className="relative grid grid-cols-3">
          {items.map((t, i) => (
            <li key={t} className={i === 0 ? 'text-left' : i === 1 ? 'text-center' : 'text-right'}>
              <motion.span className="inline-block w-6 h-6 rounded-full bg-white border-2 border-[#ff8fab]" initial={{ scale: reduce ? 1 : 0.6, opacity: reduce ? 1 : 0.4 }} animate={{ scale: active || reduce ? 1 : 0.6, opacity: active || reduce ? 1 : 0.4 }} transition={{ delay: 0.2 + i * 0.5, duration: 0.3 }} />
              <p className="mt-2 text-[13px] font-medium text-[#191f28]">{t}</p>
            </li>
          ))}
        </ol>
      </div>
      <p className="mt-8 text-[26px] lg:text-[30px] font-semibold tracking-[-0.02em] text-[#191f28]">현금 <span className="text-[#ff5c8a]">당일</span> 입금</p>
      <p className="mt-1 text-[13px] text-[#6b7684]">상품권·포인트가 아니라 계좌로 들어가요.</p>
    </div>
  )
}

function NoPushVisual({ active }: { active: boolean }) {
  const reduce = useReducedMotion()
  const items = ['다른 상품 권유 없음', '이름 묻지 않음', '고른 것만 진행']
  return (
    <div className="rounded-[20px] bg-[#f9fafb] p-6 lg:p-8" aria-label="권유 없음 약속">
      <ul className="space-y-3">
        {items.map((t, i) => (
          <motion.li key={t} className="flex items-center gap-3 h-14 px-4 rounded-2xl bg-white" initial={{ opacity: reduce ? 1 : 0, x: reduce ? 0 : 10 }} animate={{ opacity: active || reduce ? 1 : 0, x: active || reduce ? 0 : 10 }} transition={{ delay: i * 0.18, duration: 0.4, ease: EASE }}>
            <span className="w-6 h-6 rounded-full bg-[#ff8fab] text-white flex items-center justify-center"><Check className="w-3.5 h-3.5" strokeWidth={3} /></span>
            <span className="text-[15px] font-medium text-[#191f28]">{t}</span>
          </motion.li>
        ))}
      </ul>
      <p className="mt-6 text-[13px] text-[#6b7684]">상담 전화는 한 번이에요. 조건이 맞을 때만 진행해요.</p>
    </div>
  )
}

const VISUALS = [MatchVisual, CashVisual, NoPushVisual]

export default function Promises() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [active, setActive] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (v) => setActive(Math.min(2, Math.floor(v * 3))))

  return (
    <section id="promises" className="scroll-mt-16">
      <div className="max-w-[1200px] mx-auto px-5 lg:px-8 pt-24 lg:pt-40">
        <Reveal>
          <p className="text-[12px] font-medium text-[#ff5c8a]">세 가지 약속</p>
          <h2 className="mt-3 text-[22px] lg:text-[32px] font-semibold tracking-[-0.02em] leading-[1.3] text-[#191f28] break-keep">그래서 나한테<br className="lg:hidden" /> 뭘 보장하나요?</h2>
        </Reveal>
      </div>

      {/* 데스크톱: sticky 스토리텔링 */}
      <div ref={ref} className="hidden lg:block h-[300vh] max-w-[1200px] mx-auto px-8">
        <div className="sticky top-0 h-screen grid grid-cols-2 gap-16 items-center">
          <div>
            <ol className="space-y-8">
              {PROMISES.map((p, i) => (
                <li key={p.key} className={`transition-opacity duration-500 ${active === i ? 'opacity-100' : 'opacity-25'}`}>
                  <p className="text-[12px] font-semibold text-[#ff5c8a] tabular-nums">0{i + 1}</p>
                  <h3 className="mt-2 text-[28px] font-semibold tracking-[-0.02em] leading-[1.25] text-[#191f28] whitespace-pre-line">{p.title}</h3>
                  {active === i && <p className="mt-3 text-[15px] leading-relaxed text-[#6b7684] max-w-[36ch]">{p.desc}</p>}
                </li>
              ))}
            </ol>
            <a href="#terms" className="mt-10 inline-block text-[14px] font-medium text-[#4e5968] underline underline-offset-4 hover:text-[#191f28]">자세한 기준 보기</a>
          </div>
          <div className="relative min-h-[420px]">
            <AnimatePresence mode="wait">
              {(() => { const V = VISUALS[active]; return (
                <motion.div key={active} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.4, ease: EASE }}>
                  <V active />
                </motion.div>
              ) })()}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 모바일: 세로 나열 */}
      <ol className="lg:hidden max-w-[1200px] mx-auto px-5 mt-10 space-y-14">
        {PROMISES.map((p, i) => { const V = VISUALS[i]; return (
          <Reveal key={p.key} as="li">
            <p className="text-[12px] font-semibold text-[#ff5c8a]">0{i + 1}</p>
            <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] leading-[1.3] text-[#191f28] whitespace-pre-line">{p.title}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[#6b7684]">{p.desc}</p>
            <div className="mt-5"><V active /></div>
          </Reveal>
        ) })}
        <li><a href="#terms" className="text-[14px] font-medium text-[#4e5968] underline underline-offset-4">자세한 기준 보기</a></li>
      </ol>
    </section>
  )
}
