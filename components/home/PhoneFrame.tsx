import type { ReactNode } from 'react'

// 스마트폰 목업 프레임(CSS). 화면 내용은 280×580 고정 좌표로 그리고, 부모가 --phone-scale 로 통째로 줄인다.
// 이미지가 아니라 HTML 이라 글자가 선명하고 테마·폰트를 그대로 따른다.
export const PHONE_W = 280
export const PHONE_H = 580

export default function PhoneFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative select-none ${className}`} style={{ width: PHONE_W, height: PHONE_H, transform: 'scale(var(--phone-scale, 1))', transformOrigin: 'top center' }} aria-hidden>
      {/* 베젤 */}
      <div className="absolute inset-0 rounded-[44px] bg-[#1b1f27] shadow-[0_24px_60px_rgba(25,31,40,0.22),inset_0_0_0_2px_rgba(255,255,255,0.06)]" />
      {/* 측면 버튼 */}
      <div className="absolute -left-[3px] top-[110px] w-[3px] h-[28px] rounded-l bg-[#2a2f3a]" />
      <div className="absolute -left-[3px] top-[150px] w-[3px] h-[48px] rounded-l bg-[#2a2f3a]" />
      <div className="absolute -right-[3px] top-[140px] w-[3px] h-[64px] rounded-r bg-[#2a2f3a]" />
      {/* 화면 */}
      <div className="absolute inset-[10px] rounded-[36px] bg-white overflow-hidden">
        {/* 상태바 */}
        <div className="absolute top-0 inset-x-0 h-[44px] flex items-center justify-between px-6 text-[12px] font-semibold text-[#191f28] z-20">
          <span className="tabular-nums">9:41</span>
          <span className="flex items-center gap-1" aria-hidden>
            <svg width="14" height="10" viewBox="0 0 14 10" fill="#191f28"><rect x="0" y="6" width="2.5" height="4" rx=".6"/><rect x="3.8" y="4" width="2.5" height="6" rx=".6"/><rect x="7.6" y="2" width="2.5" height="8" rx=".6"/><rect x="11.4" y="0" width="2.5" height="10" rx=".6"/></svg>
            <svg width="22" height="10" viewBox="0 0 22 10" fill="none"><rect x=".5" y=".5" width="18" height="9" rx="2.5" stroke="#191f28" opacity=".5"/><rect x="2" y="2" width="14" height="6" rx="1.5" fill="#191f28"/><rect x="19.5" y="3" width="2" height="4" rx="1" fill="#191f28" opacity=".5"/></svg>
          </span>
        </div>
        {/* 다이내믹 아일랜드 */}
        <div className="absolute top-[12px] left-1/2 -translate-x-1/2 w-[78px] h-[22px] rounded-full bg-[#1b1f27] z-20" />
        {/* 내용 */}
        <div className="absolute inset-0 pt-[44px]">{children}</div>
        {/* 홈 인디케이터 */}
        <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 w-[96px] h-[5px] rounded-full bg-[#191f28]/80 z-20" />
      </div>
    </div>
  )
}
