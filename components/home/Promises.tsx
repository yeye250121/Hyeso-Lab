'use client'

import { useRef, useState, type RefObject } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { PROMISES } from '@/lib/content/promise'
import PhoneFrame, { PHONE_H } from './PhoneFrame'
import { MatchScreen, CashPushScreen, NoPushScreen } from './PhoneScreens'
import { EASE } from './motion'

// 4.2 세 가지 약속 — 왼쪽 제목, 오른쪽 스마트폰 목업의 화면이 스크롤에 따라 교체(땅요식). 모바일은 한 화면에서 단계 교체.

const VISUALS = [MatchScreen, CashPushScreen, NoPushScreen]

const STEPS = 3
const HYSTERESIS = 0.1 / STEPS // 한 단계 길이의 10%. 경계에서 손가락이 떨려도 단계가 왔다 갔다 하지 않게

/**
 * 스크롤 진행률 → 단계(0~2)와 방향(1 아래로, -1 위로). 경계를 HYSTERESIS 만큼 넘어야 바뀐다.
 */
function useStep(target: RefObject<HTMLElement>) {
  const { scrollYProgress } = useScroll({ target, offset: ['start start', 'end end'] })
  const [state, setState] = useState({ index: 0, dir: 1 })
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setState((cur) => {
      const lower = cur.index / STEPS - HYSTERESIS
      const upper = (cur.index + 1) / STEPS + HYSTERESIS
      if (v >= lower && v < upper) return cur
      const next = Math.max(0, Math.min(STEPS - 1, Math.floor(v * STEPS)))
      return next === cur.index ? cur : { index: next, dir: next > cur.index ? 1 : -1 }
    })
  })
  return state
}

// 화면 안 내용만 바뀐다. 내릴 땐 아래에서 올라오고, 올릴 땐 위에서 내려온다(프레임은 고정)
const screenVariants = {
  enter: (dir: number) => ({ y: dir > 0 ? '100%' : '-100%' }),
  center: { y: 0, opacity: 1 },
  exit: (dir: number) => ({ y: dir > 0 ? '-30%' : '30%', opacity: 0 }),
}
const textVariants = {
  enter: (dir: number) => ({ opacity: 0, y: dir > 0 ? 14 : -14 }),
  center: { opacity: 1, y: 0 },
  exit: (dir: number) => ({ opacity: 0, y: dir > 0 ? -10 : 10 }),
}

function PhoneStage({ index, dir }: { index: number; dir: number }) {
  const V = VISUALS[index]
  return (
    <PhoneFrame>
      <AnimatePresence initial={false} custom={dir}>
        <motion.div key={index} custom={dir} variants={screenVariants} className="absolute inset-0 bg-white" initial="enter" animate="center" exit="exit" transition={{ duration: 0.5, ease: EASE }}>
          <V active />
        </motion.div>
      </AnimatePresence>
    </PhoneFrame>
  )
}

export default function Promises() {
  const ref = useRef<HTMLDivElement>(null)
  const { index: active, dir } = useStep(ref)
  const mRef = useRef<HTMLDivElement>(null)
  const { index: mActive, dir: mDir } = useStep(mRef)

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
          <div className="relative flex justify-center mt-24" style={{ height: PHONE_H }}>
            <PhoneStage index={active} dir={dir} />
          </div>
        </div>
      </div>

      {/* 모바일: 스크롤 진행에 따라 한 화면에서 01→02→03 교체 */}
      {/* 단계당 약 한 화면(100svh — 주소창이 나타나도 고정 높이) 스크롤해야 넘어가도록 넉넉히. 너무 짧으면 한 번 쓸어도 두세 단계가 지나간다 */}
      <div ref={mRef} className="lg:hidden h-[400svh]">
        <div className="sticky top-[58px] h-[calc(100svh-58px)] px-5 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-5" aria-hidden>
            {PROMISES.map((p, i) => (
              <span key={p.key} className={`h-1.5 rounded-full transition-all duration-300 ${mActive === i ? 'w-7 bg-[#ff8fab]' : 'w-1.5 bg-[#e5e8eb]'}`} />
            ))}
          </div>
          <div className="relative min-h-[150px]">
            <AnimatePresence mode="wait" custom={mDir}>
              {(() => { const p = PROMISES[mActive]; return (
                <motion.div key={mActive} custom={mDir} variants={textVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: EASE }}>
                  <p className="text-[12px] font-semibold text-[#ff5c8a] tabular-nums">0{mActive + 1}</p>
                  <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] leading-[1.3] text-[#191f28] whitespace-pre-line">{p.title}</h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-[#6b7684]">{p.desc}</p>
                </motion.div>
              ) })()}
            </AnimatePresence>
          </div>
          <div className="mt-5 flex justify-center [--phone-scale:0.72] sm:[--phone-scale:0.8]" style={{ height: PHONE_H * 0.72 }}><PhoneStage index={mActive} dir={mDir} /></div>
        </div>
      </div>
    </section>
  )
}
