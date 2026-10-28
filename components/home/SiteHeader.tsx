'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const LOGO = 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/public/HYESO-LAB/logos/hyeso.png'

// 메인 헤더: 로고 · 인터넷 · 가전렌탈 · CTA 하나. 스크롤하면 블러 배경 + 얇은 보더.
export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md border-b border-[#e5e8eb]' : 'bg-transparent border-b border-transparent'}`}>
      <div className="max-w-[1200px] mx-auto px-5 lg:px-8 h-[60px] flex items-center justify-between">
        <Link href="/" aria-label="혜택연구소 홈"><Image src={LOGO} alt="혜택연구소" width={720} height={264} priority className="h-[22px] w-auto" /></Link>
        <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-[#4e5968]">
          <Link href="/internet" className="hover:text-[#191f28]">인터넷·TV</Link>
          <Link href="/electronics" className="hover:text-[#191f28]">가전렌탈</Link>
        </nav>
        <Link href="/apply" className="inline-flex items-center h-10 px-4 rounded-full bg-[#191f28] text-white text-[14px] font-semibold hover:bg-[#333d4b] transition-colors">내 사은품 확인하기</Link>
      </div>
    </header>
  )
}
