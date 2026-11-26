'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, ChevronLeft, Paperclip, Menu } from 'lucide-react'
import CountUp from './CountUp'
import { EASE } from './motion'

// 세 가지 약속 섹션의 폰 화면 3종. 실제 화면 캡처가 아니라 우리 UI 문법으로 그린 HTML(수치는 약속 설명과 같은 예시).
// 나중에 "내 상담 현황"·입금 푸시가 실제 기능이 되면 그 화면으로 바꿔 끼운다.
const MARK = 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/public/HYESO-LAB/logos/hyeso-mark.png'
const ICON = 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/public/HYESO-LAB/icons'
const won = (n: number) => n.toLocaleString('ko-KR')

function AppBar({ title, back = true }: { title: string; back?: boolean }) {
  return (
    <div className="h-[44px] flex items-center px-3 text-[15px] font-semibold text-[#191f28]">
      {back ? <ChevronLeft className="w-5 h-5 text-[#333d4b]" /> : <span className="w-5" />}
      <span className="flex-1 text-center">{title}</span>
      <span className="w-5" />
    </div>
  )
}

/** ① 차액 120% 보상 — 다른 곳 견적을 올린 뒤 보상이 확정된 화면 */
export function MatchScreen({ active }: { active: boolean }) {
  const other = 500000, ours = 450000
  const bonus = Math.round((other - ours) * 1.2)
  return (
    <div className="h-full flex flex-col bg-white">
      <AppBar title="보상 확인" />
      <div className="px-5 pt-3">
        <p className="text-[18px] font-semibold tracking-[-0.02em] leading-[1.3] text-[#191f28]">다른 곳 견적을 확인했어요<br />차액의 120%를 더 드려요</p>
        <dl className="mt-4 rounded-2xl bg-[#f9fafb] px-4 py-4 space-y-2.5 text-[13px]">
          <div className="flex justify-between"><dt className="text-[#6b7684]">다른 곳 사은품</dt><dd className="font-medium text-[#191f28] tabular-nums">{won(other)}원</dd></div>
          <div className="flex justify-between"><dt className="text-[#6b7684]">혜택연구소 사은품</dt><dd className="font-medium text-[#191f28] tabular-nums">{won(ours)}원</dd></div>
          <div className="flex justify-between border-t border-[#e5e8eb] pt-2.5"><dt className="text-[#6b7684] whitespace-nowrap">차액 × 120%</dt><dd className="font-semibold text-[#ff5c8a] tabular-nums whitespace-nowrap">+ <CountUp to={bonus} start={active} duration={900} />원</dd></div>
        </dl>
        <p className="mt-5 text-[12px] text-[#8b95a1]">최종 사은품</p>
        <p className="mt-0.5 text-[30px] font-semibold tracking-[-0.02em] text-[#191f28] tabular-nums leading-none"><CountUp to={ours + bonus} start={active} duration={1100} />원</p>
        <p className="mt-1.5 text-[12px] text-[#6b7684]">설치 당일 현금으로 드려요</p>
        <div className="mt-4 inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[#f2f4f6] text-[12px] font-medium text-[#4e5968]"><Paperclip className="w-3.5 h-3.5" /> 견적 캡처 1장 첨부됨</div>
      </div>
      <div className="mt-auto px-5 pb-7">
        <div className="h-12 rounded-2xl bg-[#ff8fab] text-white text-[14px] font-semibold flex items-center justify-center">보상 확정하기</div>
      </div>
    </div>
  )
}

/** ② 설치 당일 현금 — 앱 홈 위로 입금 푸시가 내려온 장면. 뒤 화면은 세게 흐려 시선을 배너에 모은다 */
export function CashPushScreen({ active }: { active: boolean }) {
  const reduce = useReducedMotion()
  const show = active || reduce
  return (
    <div className="h-full relative bg-white overflow-hidden">
      {/* 뒤에 깔린 앱 홈(우리 메인 히어로 축소판) */}
      <div className="absolute inset-0 pt-[14px] blur-[7px] opacity-70 scale-[1.03]" aria-hidden>
        <div className="h-[44px] flex items-center justify-between px-4">
          <span className="flex items-center gap-1.5"><Image src={MARK} alt="" width={20} height={20} className="w-5 h-5" /><span className="text-[14px] font-bold text-[#191f28]">혜소</span></span>
          <Menu className="w-5 h-5 text-[#b0b8c1]" />
        </div>
        <div className="px-6 pt-10 text-center">
          <p className="text-[22px] font-semibold tracking-[-0.02em] leading-[1.3] text-[#191f28]">놓치고 있던 혜택,<br />대신 알아볼게요</p>
          <p className="mt-3 text-[12px] text-[#6b7684]">혜택연구소에서 똑똑하게 알아봐요</p>
          <div className="mt-6 mx-auto h-[150px] rounded-2xl bg-[#f9fafb]" />
          <div className="mt-6 h-12 rounded-2xl bg-[#ff8fab]" />
        </div>
      </div>
      <div className="absolute inset-0 bg-white/35" aria-hidden />
      {/* 푸시 배너 */}
      <motion.div
        className="absolute left-3 right-3 top-[24px] rounded-[22px] bg-white/95 backdrop-blur-md shadow-[0_12px_32px_rgba(25,31,40,0.18)] px-3.5 py-3"
        initial={{ y: reduce ? 0 : -90, opacity: reduce ? 1 : 0 }}
        animate={{ y: show ? 0 : -90, opacity: show ? 1 : 0 }}
        transition={{ delay: 0.35, duration: 0.55, ease: EASE }}
      >
        <div className="flex items-center gap-2">
          <span className="w-[22px] h-[22px] rounded-[6px] bg-white ring-1 ring-black/[0.06] flex items-center justify-center"><Image src={MARK} alt="" width={16} height={16} className="w-4 h-4" /></span>
          <span className="text-[11px] font-medium text-[#6b7684] flex-1">혜택연구소</span>
          <span className="text-[11px] text-[#8b95a1]">지금</span>
        </div>
        <p className="mt-1.5 text-[14px] font-semibold text-[#191f28] leading-snug whitespace-nowrap">사은품 510,000원 입금 완료</p>
        <p className="mt-0.5 text-[12.5px] text-[#4e5968] leading-snug">설치 확인됐어요. 오늘 계좌로 보내드렸어요.</p>
      </motion.div>
    </div>
  )
}

/** ③ 권유 없음 — 실제 상담 신청 폼 그대로: 번호 하나, 동의, 시작 */
export function NoPushScreen({ active }: { active: boolean }) {
  const reduce = useReducedMotion()
  const services = [
    { key: 'internet', label: '인터넷', icon: `${ICON}/internet_icon.png`, on: true },
    { key: 'electronics', label: '가전렌탈', icon: `${ICON}/electronics_icon.png`, on: false },
  ]
  return (
    <div className="h-full flex flex-col bg-white">
      <AppBar title="상담 신청" back={false} />
      <div className="px-5 pt-2">
        <p className="text-[18px] font-semibold tracking-[-0.02em] leading-[1.3] text-[#191f28]">번호만 남겨 주세요<br /><span className="text-[#ff5c8a]">이름은 묻지 않아요</span></p>
        <p className="mt-4 text-[12px] font-medium text-[#6b7684]">어떤 혜택을 알아볼까요?</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {services.map((s) => (
            <div key={s.key} className={`h-[52px] rounded-xl flex items-center justify-center gap-1.5 text-[13px] font-semibold ${s.on ? 'bg-[#fff1f5] ring-[1.5px] ring-[#ff8fab] text-[#191f28]' : 'bg-[#f2f4f6] text-[#6b7684]'}`}>
              <Image src={s.icon} alt="" width={22} height={22} className="w-[22px] h-[22px]" />{s.label}
            </div>
          ))}
        </div>
        <p className="mt-4 text-[12px] font-medium text-[#6b7684]">휴대폰 번호</p>
        <div className="mt-2 h-12 rounded-xl bg-[#f2f4f6] px-4 flex items-center text-[14px] tabular-nums text-[#191f28]">
          010-1234-
          <motion.span className="inline-block w-[2px] h-[18px] bg-[#ff8fab] ml-[1px]" animate={{ opacity: reduce ? 1 : [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1 }} />
        </div>
        <div className="mt-3 h-12 rounded-xl bg-[#f2f4f6] px-4 flex items-center gap-2.5 text-[13px] font-semibold text-[#191f28]">
          <span className="w-5 h-5 rounded-full bg-[#ff8fab] text-white flex items-center justify-center"><Check className="w-3 h-3" strokeWidth={3} /></span>전체 동의
        </div>
      </div>
      <div className="mt-auto px-5 pb-7">
        <motion.div className="h-12 rounded-2xl bg-[#ff8fab] text-white text-[14px] font-semibold flex items-center justify-center" initial={{ opacity: 0.6 }} animate={{ opacity: active || reduce ? 1 : 0.6 }} transition={{ delay: 0.3 }}>연구 시작하기</motion.div>
        <p className="mt-2.5 text-center text-[11px] text-[#8b95a1]">전화는 한 번, 다른 상품 권유는 없어요</p>
      </div>
    </div>
  )
}
