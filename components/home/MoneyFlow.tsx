'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import CountUp from './CountUp'
import { EASE } from './motion'

// 히어로 시그니처: '광고비' 블록이 줄어들고 그 돈이 '내 사은품'으로 흘러 들어간다. 3초 안에 끝난다.
// SVG + framer-motion. reduced-motion 이면 최종 상태 정지 그림.
export default function MoneyFlow({ maxGift }: { maxGift: number }) {
  const reduce = useReducedMotion()
  const [go, setGo] = useState(false)
  useEffect(() => { const t = setTimeout(() => setGo(true), 300); return () => clearTimeout(t) }, [])
  const done = reduce || false
  const W = 520, H = 330
  // 왼쪽 기둥(다른 곳): 광고비 90 + 마진 50 + 사은품 80 = 220. 오른쪽(혜택연구소): 사은품 220
  const base = 292
  const coins = [0, 1, 2, 3, 4, 5]
  return (
    <div className="relative w-full max-w-[520px] mx-auto" aria-label="광고비를 쓰지 않고 그 돈을 사은품으로 드리는 구조">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        {/* 바닥선 */}
        <line x1={40} x2={W - 40} y1={base} y2={base} stroke="#e5e8eb" strokeWidth={1} />
        {/* 다른 곳 */}
        <g>
          <motion.rect x={80} width={120} rx={10} fill="#e5e8eb" initial={{ y: base - 220, height: 90 }} animate={go && !reduce ? { height: 0, y: base - 130 } : done ? { height: 0, y: base - 130 } : {}} transition={{ duration: 0.8, ease: EASE, delay: 0.3 }} />
          <motion.rect x={80} width={120} rx={10} fill="#eceef1" initial={{ y: base - 130, height: 50 }} animate={go && !reduce ? { height: 0, y: base - 80 } : done ? { height: 0, y: base - 80 } : {}} transition={{ duration: 0.6, ease: EASE, delay: 0.7 }} />
          <rect x={80} y={base - 80} width={120} height={80} rx={10} fill="#b0b8c1" />
          <motion.text x={140} y={base - 160} textAnchor="middle" fontSize={13} fill="#8b95a1" fontWeight={500} initial={{ opacity: 1 }} animate={go || reduce ? { opacity: 0 } : {}} transition={{ duration: 0.4, delay: 0.4 }}>광고비</motion.text>
          <motion.text x={140} y={base - 100} textAnchor="middle" fontSize={13} fill="#8b95a1" fontWeight={500} initial={{ opacity: 1 }} animate={go || reduce ? { opacity: 0 } : {}} transition={{ duration: 0.4, delay: 0.7 }}>중간 마진</motion.text>
          <text x={140} y={base - 34} textAnchor="middle" fontSize={13} fill="#fff" fontWeight={600}>사은품</text>
          <text x={140} y={base + 22} textAnchor="middle" fontSize={12} fill="#8b95a1">다른 곳</text>
        </g>
        {/* 흘러가는 동전 */}
        {!reduce && coins.map((i) => (
          <motion.circle key={i} r={6} fill="#ff8fab" initial={{ cx: 140, cy: base - 200 + i * 14, opacity: 0 }} animate={go ? { cx: [140, 260, 380], cy: [base - 200 + i * 14, base - 230 - i * 6, base - 120 - i * 10], opacity: [0, 1, 1, 0] } : {}} transition={{ duration: 1.1, ease: 'easeInOut', delay: 0.5 + i * 0.12 }} />
        ))}
        {/* 혜택연구소 */}
        <g>
          <motion.rect x={320} width={120} rx={10} fill="#ff8fab" initial={{ y: base - 80, height: 80 }} animate={go || reduce ? { y: base - 220, height: 220 } : {}} transition={{ duration: 1.0, ease: EASE, delay: 0.9 }} />
          <text x={380} y={base - 34} textAnchor="middle" fontSize={13} fill="#fff" fontWeight={600}>사은품</text>
          <text x={380} y={base + 22} textAnchor="middle" fontSize={12} fill="#191f28" fontWeight={600}>혜택연구소</text>
        </g>
      </svg>
      {/* 금액 라벨 */}
      <div className="absolute right-[7%] top-0 text-right">
        <p className="text-[11px] text-[#8b95a1]">인터넷 최대</p>
        <p className="text-[22px] lg:text-[26px] font-bold tracking-[-0.02em] text-[#191f28] tabular-nums">
          {reduce ? maxGift.toLocaleString('ko-KR') : <CountUp to={maxGift} start={go} delay={900} duration={1400} />}<span className="text-[14px] font-medium ml-0.5">원</span>
        </p>
      </div>
    </div>
  )
}
