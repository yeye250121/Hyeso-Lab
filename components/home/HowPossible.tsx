'use client'

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import Reveal from './Reveal'

// 4.3 어떻게 가능한가 — 스크롤에 연동해 '광고비·마진'이 줄고 '사은품'이 커지는 비교 막대.
export default function HowPossible() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'center 45%'] })
  const p = reduce ? { get: () => 1 } : scrollYProgress
  const ad = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [96, 0])
  const margin = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [56, 0])
  const ours = useTransform(scrollYProgress, [0, 1], reduce ? [232, 232] : [80, 232])
  void p
  return (
    <section className="bg-[#191f28] text-white mt-24 lg:mt-40">
      <div className="max-w-[1200px] mx-auto px-5 lg:px-8 py-24 lg:py-40 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <Reveal>
          <p className="text-[13px] font-semibold text-[#ff9fb8]">어떻게 가능할까요?</p>
          <h2 className="mt-3 text-[28px] lg:text-[48px] font-bold tracking-[-0.03em] leading-[1.2] break-keep">광고 모델을 쓰지 않아요</h2>
          <p className="mt-5 text-[16px] lg:text-[18px] leading-relaxed text-white/70 max-w-[40ch] break-keep">광고에 쓸 돈을 전부 고객에게 돌려드려요. 월 요금은 어디서 가입해도 같아요. 다른 건 사은품뿐이에요.</p>
        </Reveal>
        <div ref={ref} className="rounded-[24px] bg-white/[0.06] ring-1 ring-white/10 p-6 lg:p-8">
          <div className="grid grid-cols-2 gap-8 items-end h-[280px]">
            <div className="flex flex-col justify-end gap-1.5 h-full">
              <motion.div style={{ height: ad }} className="rounded-xl bg-white/10 overflow-hidden flex items-center justify-center text-[12px] text-white/90">광고비</motion.div>
              <motion.div style={{ height: margin }} className="rounded-xl bg-white/10 overflow-hidden flex items-center justify-center text-[12px] text-white/90">중간 마진</motion.div>
              <div className="h-[80px] rounded-xl bg-white/25 flex items-center justify-center text-[13px] font-medium">사은품</div>
            </div>
            <div className="flex flex-col justify-end h-full">
              <motion.div style={{ height: ours }} className="rounded-xl bg-[#ff8fab] text-[#191f28] flex items-center justify-center text-[14px] font-semibold shadow-[0_12px_30px_rgba(255,143,171,0.35)]">사은품</motion.div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-8 text-center text-[13px]"><span className="text-white/75">다른 곳</span><span className="font-semibold">혜택연구소</span></div>
        </div>
      </div>
    </section>
  )
}
