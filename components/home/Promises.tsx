'use client'

import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { PROMISES } from '@/lib/content/promise'
import PhoneFrame, { PHONE_H } from './PhoneFrame'
import { MatchScreen, CashPushScreen, NoPushScreen } from './PhoneScreens'
import { EASE } from './motion'

// 4.2 세 가지 약속 — 왼쪽 제목, 오른쪽 스마트폰 목업의 화면이 스크롤에 따라 교체(땅요식). 모바일은 한 화면에서 단계 교체.

const VISUALS = [MatchScreen, CashPushScreen, NoPushScreen]

export default function Promises() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [active, setActive] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (v) => setActive(Math.min(2, Math.floor(v * 3))))
  const mRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: mProgress } = useScroll({ target: mRef, offset: ['start start', 'end end'] })
  const [mActive, setMActive] = useState(0)
  useMotionValueEvent(mProgress, 'change', (v) => setMActive(Math.min(2, Math.floor(v * 3))))

  return (
    <section id="promises" className="scroll-mt-16">
      {/* 데스크톱: sticky 스토리텔링 */}
      <div ref={ref} className="hidden lg:block h-[300vh] max-w-[960px] mx-auto px-8">
        <div className="sticky top-0 h-screen grid grid-cols-[1fr_440px] gap-12 items-center">
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
          </div>
          <div className="relative flex justify-center [--phone-scale:1.22]" style={{ height: PHONE_H * 1.22 }}>
            <AnimatePresence mode="wait">
              {(() => { const V = VISUALS[active]; return (
                <motion.div key={active} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.45, ease: EASE }}>
                  <PhoneFrame><V active /></PhoneFrame>
                </motion.div>
              ) })()}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 모바일: 스크롤 진행에 따라 한 화면에서 01→02→03 교체 */}
      <div ref={mRef} className="lg:hidden h-[260vh]">
        <div className="sticky top-[58px] h-[calc(100vh-58px)] px-5 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-5" aria-hidden>
            {PROMISES.map((p, i) => (
              <span key={p.key} className={`h-1.5 rounded-full transition-all duration-300 ${mActive === i ? 'w-7 bg-[#ff8fab]' : 'w-1.5 bg-[#e5e8eb]'}`} />
            ))}
          </div>
          <AnimatePresence mode="wait">
            {(() => { const p = PROMISES[mActive]; const V = VISUALS[mActive]; return (
              <motion.div key={mActive} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35, ease: EASE }}>
                <p className="text-[12px] font-semibold text-[#ff5c8a] tabular-nums">0{mActive + 1}</p>
                <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] leading-[1.3] text-[#191f28] whitespace-pre-line">{p.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-[#6b7684]">{p.desc}</p>
                <div className="mt-5 flex justify-center [--phone-scale:0.72] sm:[--phone-scale:0.8]" style={{ height: PHONE_H * 0.72 }}><PhoneFrame><V active /></PhoneFrame></div>
              </motion.div>
            ) })()}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
