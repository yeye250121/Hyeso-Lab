import type { ReactNode } from 'react'

// 스마트폰 목업 프레임(CSS). 땡겨요처럼 연한 회색 베젤만 있는 단순한 형태(노치·상태바 없음).
// 화면 내용은 280×580 좌표로 그리고, 부모가 --phone-scale 로 통째로 키우거나 줄인다.
export const PHONE_W = 280
export const PHONE_H = 580

export default function PhoneFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative select-none ${className}`} style={{ width: PHONE_W, height: PHONE_H, transform: 'scale(var(--phone-scale, 1))', transformOrigin: 'top center' }} aria-hidden>
      <div className="absolute inset-0 rounded-[40px] bg-[#e9ecf1] shadow-[0_20px_50px_rgba(25,31,40,0.10)]" />
      <div className="absolute inset-[8px] rounded-[33px] bg-white overflow-hidden">
        <div className="absolute inset-0 pt-[14px]">{children}</div>
      </div>
    </div>
  )
}
