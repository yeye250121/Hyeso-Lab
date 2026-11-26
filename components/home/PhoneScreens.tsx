'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { Paperclip } from 'lucide-react'
import CountUp from './CountUp'

// 세 가지 약속 섹션의 폰 화면 3종. 실제 화면 캡처가 아니라 우리 UI 문법으로 그린 HTML(수치는 약속 설명과 같은 예시).
// 나중에 "내 상담 현황"·입금 푸시가 실제 기능이 되면 그 화면으로 바꿔 끼운다.
const MARK = 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/public/HYESO-LAB/logos/hyeso-mark.png'
const won = (n: number) => n.toLocaleString('ko-KR')

const LOGO = 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/public/HYESO-LAB/logos/hyeso.png'

/** 혜소 모바일 내비바 축소판(로고 + 햄버거). 폰 화면 맨 위에 얹는다 */
function MiniNav() {
  return (
    <div className="h-[44px] shrink-0 flex items-center justify-between px-5">
      <Image src={LOGO} alt="" width={720} height={264} className="h-[18px] w-auto" />
      <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" aria-hidden><path fill="#B0B8C1" d="M4.118 6.2h16a1.2 1.2 0 100-2.4h-16a1.2 1.2 0 100 2.4m16 4.6h-16a1.2 1.2 0 100 2.4h16a1.2 1.2 0 100-2.4m0 7h-16a1.2 1.2 0 100 2.4h16a1.2 1.2 0 100-2.4" fillRule="evenodd"/></svg>
    </div>
  )
}

/** ① 차액 120% 보상 — 제목 두 줄, 사은품 금액 박스, 견적 첨부, 버튼만 */
export function MatchScreen({ active }: { active: boolean }) {
  const ours = 450000, bonus = Math.round((500000 - ours) * 1.2)
  return (
    <div className="h-full flex flex-col bg-white">
      <MiniNav />
      <div className="px-5 pt-6">
        <p className="text-[22px] font-semibold tracking-[-0.02em] leading-[1.3] text-[#191f28]">혜소가 더 드릴게요</p>
        <p className="mt-1.5 text-[15px] font-medium text-[#ff5c8a]">차액의 120% 더 드려요</p>
        <div className="mt-7 rounded-2xl bg-[#f9fafb] px-5 py-5">
          <p className="text-[12px] text-[#8b95a1]">사은품 금액</p>
          <p className="mt-1 text-[30px] font-semibold tracking-[-0.02em] text-[#191f28] tabular-nums leading-tight"><CountUp to={ours + bonus} start={active} duration={1100} />원</p>
          <p className="mt-1.5 text-[12px] text-[#6b7684] tabular-nums">{won(ours)}원 + 보상 <span className="font-semibold text-[#ff5c8a]">{won(bonus)}원</span></p>
        </div>
        <div className="mt-4 inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[#f2f4f6] text-[12px] font-medium text-[#4e5968]"><Paperclip className="w-3.5 h-3.5" /> 다른 곳 견적 첨부됨</div>
      </div>
      <div className="mt-auto px-5 pb-7">
        <div className="h-12 rounded-2xl bg-[#ff8fab] text-white text-[14px] font-semibold flex items-center justify-center">보상 받기</div>
      </div>
    </div>
  )
}

/** ② 설치 당일 현금 — 입금 푸시 배너. ① 화면 위에 블러를 깔고 이 배너만 위에서 내려온다(PhoneStage 가 합성) */
export function PushBanner() {
  return (
    <div className="rounded-[22px] bg-white/95 backdrop-blur-md shadow-[0_12px_32px_rgba(25,31,40,0.18)] px-3.5 py-3">
      <div className="flex items-center gap-2">
        <span className="w-[22px] h-[22px] rounded-[6px] bg-white ring-1 ring-black/[0.06] flex items-center justify-center"><Image src={MARK} alt="" width={16} height={16} className="w-4 h-4" /></span>
        <span className="text-[11px] font-medium text-[#6b7684] flex-1">혜택연구소</span>
        <span className="text-[11px] text-[#8b95a1]">지금</span>
      </div>
      <p className="mt-1.5 text-[14px] font-semibold text-[#191f28] leading-snug whitespace-nowrap">사은품 510,000원 입금 완료</p>
      <p className="mt-0.5 text-[12.5px] text-[#4e5968] leading-snug">설치 확인됐어요. 오늘 계좌로 보내드렸어요.</p>
    </div>
  )
}

/** ③ 권유 없음 — 제목 두 줄, 번호 입력칸, 버튼만 */
export function NoPushScreen({ active }: { active: boolean }) {
  const reduce = useReducedMotion()
  return (
    <div className="h-full flex flex-col bg-white">
      <MiniNav />
      <div className="px-5 pt-6">
        <p className="text-[22px] font-semibold tracking-[-0.02em] leading-[1.3] text-[#191f28]">번호만 남겨 주세요</p>
        <p className="mt-1.5 text-[15px] font-medium text-[#ff5c8a]">다른 상품은 권하지 않아요</p>
        <p className="mt-7 text-[12px] text-[#8b95a1]">휴대폰 번호</p>
        <div className="mt-2 h-14 rounded-2xl bg-[#f2f4f6] px-4 flex items-center text-[16px] tabular-nums text-[#191f28]">
          010-1234-
          <motion.span className="inline-block w-[2px] h-[20px] bg-[#ff8fab] ml-[1px]" animate={{ opacity: reduce ? 1 : [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1 }} />
        </div>
      </div>
      <div className="mt-auto px-5 pb-7">
        <motion.div className="h-12 rounded-2xl bg-[#ff8fab] text-white text-[14px] font-semibold flex items-center justify-center" initial={{ opacity: 0.6 }} animate={{ opacity: active || reduce ? 1 : 0.6 }} transition={{ delay: 0.3 }}>연구 시작하기</motion.div>
      </div>
    </div>
  )
}
