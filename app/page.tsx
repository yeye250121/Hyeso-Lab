'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Footer } from '@/app/landing/components'

const LOGO_URL = 'https://hvwgs4k77hcs8ntu.public.blob.vercel-storage.com/piooom_logo'

export default function PartnersLandingPage() {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Intersection Observer for fade-in animations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up')
            entry.target.classList.remove('opacity-0', 'translate-y-12')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    const animatedElements = document.querySelectorAll('.animate-on-scroll')
    animatedElements.forEach((el) => observerRef.current?.observe(el))

    return () => observerRef.current?.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with integrated Navigation */}
      <section className="bg-[#191f28] min-h-[600px] flex flex-col">
        {/* Navigation - 히어로 내부에 통합 */}
        <nav className="relative">
          <div className="h-16 max-w-[1100px] mx-auto px-6 flex items-center justify-between">
            <Link href="/">
              <Image
                src="https://hvwgs4k77hcs8ntu.public.blob.vercel-storage.com/piooom_logo_with_text_v01.png"
                alt="Piooom"
                width={100}
                height={28}
                className="h-5 w-auto brightness-0 invert"
              />
            </Link>
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/partners/login"
                className="text-[#3182f6] hover:text-[#1b64da] text-sm font-semibold transition-colors"
              >
                파트너스 로그인
              </Link>
              <Link
                href="/partners/register"
                className="bg-[#3182f6] hover:bg-[#1b64da] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                회원가입
              </Link>
            </div>
            {/* Mobile Hamburger Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="메뉴 열기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6">
                <path fill="#B0B8C1" d="M4.118 6.2h16a1.2 1.2 0 100-2.4h-16a1.2 1.2 0 100 2.4m16 4.6h-16a1.2 1.2 0 100 2.4h16a1.2 1.2 0 100-2.4m0 7h-16a1.2 1.2 0 100 2.4h16a1.2 1.2 0 100-2.4" fillRule="evenodd"/>
              </svg>
            </button>
          </div>
          {/* Mobile Menu Accordion */}
          <div className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${mobileMenuOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="px-6 py-4 space-y-3 border-t border-[#333d4b]">
              <Link
                href="/partners/login"
                className="block w-full text-center text-[#3182f6] border border-[#3182f6] text-base font-semibold px-4 py-3 rounded-xl transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                파트너스 로그인
              </Link>
              <Link
                href="/partners/register"
                className="block w-full text-center bg-white hover:bg-gray-100 text-[#3182f6] text-base font-semibold px-4 py-3 rounded-xl transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                회원가입
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="flex-1 flex items-center">
          <div className="max-w-[1100px] mx-auto px-6 py-24 lg:py-32 text-center w-full">
          <div className="animate-on-scroll opacity-0 translate-y-12 transition-all duration-700">
            <Image
              src={LOGO_URL}
              alt="Piooom"
              width={240}
              height={72}
              className="h-[72px] w-auto mb-6 mx-auto"
            />
            <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight mb-6">
              집에서 시작하는<br />온라인 사업<br />
              <span className="text-[#3182f6]">블룸</span> 파트너스
            </h1>
            <p className="text-white/70 text-lg lg:text-xl max-w-2xl mx-auto mb-10">
              <br />상담을 연결하면 수익이 생겨요<br />
              전부 다, 블룸이 도와드릴게요.
            </p>
            <Link
              href="/partners/login"
              className="inline-flex items-center gap-2 bg-[#3182f6] hover:bg-[#1b64da] text-white text-lg font-semibold px-8 py-4 rounded-xl transition-all hover:scale-105"
            >
              지금 시작하기
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center mb-16 lg:mb-20 animate-on-scroll opacity-0 translate-y-12 transition-all duration-700">
            <h2 className="text-3xl lg:text-4xl font-bold text-[#333d4b]">
              블룸 파트너만<br />받을 수 있어요
            </h2>
          </div>

          {/* Benefit Cards */}
          <div className="space-y-16 lg:space-y-20">
            {/* Benefit 1 */}
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 animate-on-scroll opacity-0 translate-y-12 transition-all duration-700">
              <div className="w-[280px] lg:w-[290px] h-[230px] lg:h-[290px] rounded-[24px] bg-[#e8f3ff] flex items-center justify-center flex-shrink-0">
                <Image
                  src="https://hvwgs4k77hcs8ntu.public.blob.vercel-storage.com/piooom_idea_icon_v02.png"
                  alt="아이디어 아이콘"
                  width={240}
                  height={240}
                  className="w-48 h-48 lg:w-56 lg:h-56 object-contain"
                />
              </div>
              <div className="text-center lg:text-left lg:self-start lg:w-[300px]">
                <h3 className="text-2xl lg:text-3xl font-bold text-[#333d4b] mb-4 leading-tight">
                  검증된 방법을<br />
                  알려드려요
                </h3>
                <p className="text-lg lg:text-xl text-[#4e5968] leading-relaxed">
                  요즘 뜨는 트렌드와<br />성공하는 가이드라인을 드려요.
                </p>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="flex flex-col lg:flex-row-reverse items-center justify-center gap-8 lg:gap-12 animate-on-scroll opacity-0 translate-y-12 transition-all duration-700">
              <div className="w-[280px] lg:w-[290px] h-[230px] lg:h-[290px] rounded-[24px] bg-[#f0faf6] flex items-center justify-center flex-shrink-0">
                <Image
                  src="https://hvwgs4k77hcs8ntu.public.blob.vercel-storage.com/piooom_money_icon_v01.png"
                  alt="수수료 아이콘"
                  width={240}
                  height={240}
                  className="w-48 h-48 lg:w-56 lg:h-56 object-contain"
                />
              </div>
              <div className="text-center lg:text-left lg:self-start lg:w-[300px]">
                <h3 className="text-2xl lg:text-3xl font-bold text-[#333d4b] mb-4 leading-tight">
                  수수료는 기본,<br />
                  지원금도 받아요
                </h3>
                <p className="text-lg lg:text-xl text-[#4e5968] leading-relaxed">
                  매달 성과가 오르면<br />지원금을 더 드려요.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="relative bg-[#e8f3ff] pt-16 lg:pt-24 pb-48 lg:pb-56">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center animate-on-scroll opacity-0 translate-y-12 transition-all duration-700 mb-12 lg:mb-16">
            <h3 className="text-2xl lg:text-3xl font-bold text-[#333d4b] leading-tight mb-4">
              하고 싶은 것만<br />딱 골라서 해요
            </h3>
            <p className="text-lg lg:text-xl text-[#4e5968]">
              고객 상담부터 관리까지,<br />블룸이 귀찮은 건 다 해드릴게요.
            </p>
          </div>
        </div>
        {/* 이미지 - 하단이 Support 섹션 하단(=CTA 상단)과 일치 */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 z-10 flex items-end">
          <Image
            src="https://hvwgs4k77hcs8ntu.public.blob.vercel-storage.com/piooom_a_man_looking_phone_icon_v02.png"
            alt="폰을 보는 사람"
            width={320}
            height={320}
            className="w-56 h-56 lg:w-72 lg:h-72 object-contain object-bottom"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#191f28] pt-32 lg:pt-40 pb-24 lg:pb-32">
        <div className="max-w-[1100px] mx-auto px-6 text-center">
          <div className="animate-on-scroll opacity-0 translate-y-12 transition-all duration-700">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              블룸과 함께<br />더 크게 성장해요
            </h2>
            <p className="text-white/60 text-lg mb-10">
              지금 바로 파트너가 되어보세요.
            </p>
            <Link
              href="/partners/login"
              className="inline-flex items-center gap-2 bg-[#3182f6] hover:bg-[#1b64da] text-white text-lg font-semibold px-8 py-4 rounded-xl transition-all hover:scale-105"
            >
              30초 만에 시작하기
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer logoSrc={LOGO_URL} />

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(48px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.7s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
