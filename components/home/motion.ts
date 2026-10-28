'use client'

import type { Variants } from 'framer-motion'

// 공통 모션. 등장은 한 번만, 20% 보이면 시작. 초기 상태를 투명으로 두되 SSR 결과는 CSS 로 보이게 둔다(아래 .home-fade 참고).
export const EASE = [0.22, 1, 0.36, 1] as const
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}
export const stagger = (gap = 0.08): Variants => ({ hidden: {}, show: { transition: { staggerChildren: gap } } })
export const viewport = { once: true, amount: 0.2 } as const
