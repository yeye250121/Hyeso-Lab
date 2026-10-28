'use client'

import LazyMount from './LazyMount'
import PromisesStatic from './PromisesStatic'
import HowPossibleStatic from './HowPossibleStatic'
import type { GiftCase } from '@/components/landing/PartnerLanding'

// framer-motion 이 든 섹션들. 서버는 정적 버전을 그리고, 화면 근처에 오면 그때 모듈을 받아 모션 버전으로 바꾼다.
const loadPromises = () => import('./Promises')
const loadHow = () => import('./HowPossible')
const loadCases = () => import('./CaseMarquee')

export function PromisesLazy() {
  return <LazyMount load={loadPromises} props={{}} fallback={<PromisesStatic />} />
}
export function HowPossibleLazy() {
  return <LazyMount load={loadHow} props={{}} fallback={<HowPossibleStatic />} />
}
export function CaseMarqueeLazy({ cases, className }: { cases: GiftCase[]; className?: string }) {
  return <LazyMount load={loadCases} props={{ cases, className }} fallback={<div className={className} />} />
}
