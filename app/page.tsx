'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import Footer from '@/components/shared/Footer'
import Navbar from '@/components/shared/Navbar'

const LOGO_URL = 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/public/HYESO-LAB/logos/hyeso-lab_logo_pic_text_black.png'

// 명세서 폼(M1)이 생기기 전까지는 유일한 입력폼인 렌탈 신청으로 보낸다.
const START_HREF = '/apply'

const PRODUCTS = [
  {
    id: 'card',
    title: '카드 연구',
    icon: 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/public/HYESO-LAB/icons/card_icon.png',
  },
  {
    id: 'electronics',
    title: '가전 렌탈',
    icon: 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/public/HYESO-LAB/icons/electronics_icon.png',
  },
  {
    id: 'internet',
    title: '인터넷 연구',
    icon: 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/public/HYESO-LAB/icons/internet_icon.png',
  },
]

const CONCERNS = [
  {
    title: ['지원금은 도대체', '어떻게 받는거지?'],
    body: ['혜택 연구소가 최대 혜택으로', '대신 연구해드릴게요.'],
    icon: 'https://hvwgs4k77hcs8ntu.public.blob.vercel-storage.com/blooom_money_icon_v01.png',
    alt: '지원금 아이콘',
  },
  {
    title: ['넘치는 선택지에', '많은 시간을 낭비해요.'],
    body: ['인터넷 하나만 해도', '상품도 요금제도 다양한걸요.'],
    icon: 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/public/HYESO-LAB/icons/select-pbl_icon%20(2).png',
    alt: '선택지 아이콘',
  },
  {
    title: ['믿을만 한 곳인지', '걱정돼요.'],
    body: ['약속한 혜택은 언제쯤', '받을 수 있을까요?'],
    icon: 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/public/HYESO-LAB/icons/trust_icon.png',
    alt: '걱정 아이콘',
  },
]

function ArrowIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

export default function HomePage() {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const [activeSlide, setActiveSlide] = useState(0)
  const sliderRef = useRef<HTMLDivElement>(null)

  const handleSliderScroll = () => {
    if (!sliderRef.current) return
    const scrollLeft = sliderRef.current.scrollLeft
    const cardWidth = sliderRef.current.children[0]?.clientWidth || 280
    const gap = 24 // 6 * 4px
    setActiveSlide(Math.round(scrollLeft / (cardWidth + gap)))
  }

  const scrollToSlide = (index: number) => {
    const child = sliderRef.current?.children[index] as HTMLElement | undefined
    child?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up')
            entry.target.classList.remove('opacity-0', 'translate-y-12')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
    )
    document.querySelectorAll('.animate-on-scroll').forEach((el) => observerRef.current?.observe(el))
    return () => observerRef.current?.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative -mt-16 pt-16 overflow-x-clip bg-[linear-gradient(180deg,#ffffff_0%,#fff3f6_60%,#f9fafb_100%)]">
        <div
          aria-hidden
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[640px] h-[640px] lg:w-[900px] lg:h-[900px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,143,171,0.2)_0%,rgba(255,143,171,0)_65%)] pointer-events-none"
        />
        <div className="relative max-w-[1100px] mx-auto px-6 min-h-[460px] lg:min-h-[540px] flex flex-col items-center lg:items-start justify-center text-center lg:text-left pt-16 pb-20 lg:pt-32 lg:pb-24">
          <div className="lg:pl-8 animate-on-scroll opacity-0 translate-y-12 transition-all duration-700">
            <h1 className="text-[27px] leading-[1.3] sm:text-[37px] lg:text-[44px] lg:leading-[1.25] font-semibold text-[#333d4b] tracking-[-0.02em] mb-4 lg:mb-6">
              놓치고 있던 혜택,<br />대신 알아볼게요
            </h1>
            <p className="text-[18px] lg:text-[21px] text-[#6b7684] mb-8 lg:mb-10">
              혜택연구소에서 똑똑하게 알아봐요
            </p>
            <Link
              href={START_HREF}
              className="inline-flex items-center gap-2 bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-white text-[15px] font-medium px-6 py-3.5 rounded-xl transition-colors"
            >
              연구 시작하기
              <ArrowIcon />
            </Link>
          </div>
        </div>

        <a
          href="#concerns"
          aria-label="아래로 이동"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-gray-400 hover:text-gray-600 transition-colors animate-bounce"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </a>
      </section>

      {/* 고민 */}
      <section id="concerns" className="py-20 lg:py-28 bg-gray-50 scroll-mt-16">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center mb-12 lg:mb-16 animate-on-scroll opacity-0 translate-y-12 transition-all duration-700">
            <h2 className="text-[28px] leading-tight lg:text-4xl font-semibold text-[#333d4b] tracking-[-0.02em]">
              이런 고민,<br />한 번쯤 해보셨나요?
            </h2>
          </div>

          <div
            ref={sliderRef}
            onScroll={handleSliderScroll}
            className="flex lg:grid lg:grid-cols-3 gap-6 overflow-x-auto snap-x snap-mandatory px-6 lg:px-0 pb-4 lg:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {CONCERNS.map((item, i) => (
              <div
                key={item.alt}
                className="flex-none w-[280px] sm:w-[320px] lg:w-auto h-[360px] lg:h-[420px] rounded-[32px] bg-gradient-to-t from-gray-200/80 to-gray-50 flex flex-col items-center text-center pt-10 px-6 snap-center animate-on-scroll opacity-0 translate-y-12 transition-all duration-700"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="mb-auto">
                  <h3 className="text-xl lg:text-2xl font-semibold text-[#4e5968] mb-4 leading-tight">
                    {item.title[0]}<br />{item.title[1]}
                  </h3>
                  <p className="text-[15px] lg:text-base text-[#6b7684] leading-relaxed">
                    {item.body[0]}<br />{item.body[1]}
                  </p>
                </div>
                <div className="relative w-full h-[140px] lg:h-[180px] flex items-end justify-center pb-6">
                  <Image
                    src={item.icon}
                    alt={item.alt}
                    width={240}
                    height={240}
                    className="w-32 h-32 lg:w-40 lg:h-40 object-contain scale-[1.2] origin-bottom"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-2 mt-4 lg:hidden">
            {CONCERNS.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToSlide(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeSlide === i ? 'bg-[var(--action-primary)] w-6' : 'bg-gray-300 w-2 hover:bg-gray-400'
                }`}
                aria-label={`${i + 1}번째 카드로 이동`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 상품군 */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center mb-10 lg:mb-14 animate-on-scroll opacity-0 translate-y-12 transition-all duration-700">
            <h2 className="text-[28px] leading-tight lg:text-4xl font-semibold text-[#333d4b] tracking-[-0.02em]">
              어떤 혜택을 연구해 볼까요?
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-4 lg:gap-6 max-w-[360px] md:max-w-[480px] mx-auto">
            {PRODUCTS.map((product) => (
              <Link
                href={`/${product.id}`}
                key={product.id}
                className="group flex flex-col items-center justify-center gap-4 hover:-translate-y-2 transition-all duration-300 cursor-pointer animate-on-scroll opacity-0 translate-y-12"
              >
                <div className="w-20 h-20 lg:w-24 lg:h-24 flex items-center justify-center mb-1 transition-transform duration-300 group-hover:scale-105">
                  <Image
                    src={product.icon}
                    alt={product.title}
                    width={96}
                    height={96}
                    className="object-contain w-full h-full"
                  />
                </div>
                <h3 className="text-lg lg:text-xl font-medium text-[#6b7684] whitespace-nowrap">
                  {product.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 마무리 CTA */}
      <section className="pb-20 lg:pb-28 bg-gray-50">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="rounded-[32px] bg-[#fff1f5] px-6 py-14 lg:py-20 text-center animate-on-scroll opacity-0 translate-y-12 transition-all duration-700">
            <h2 className="text-2xl lg:text-[32px] font-semibold text-[#333d4b] tracking-[-0.02em] leading-tight mb-3">
              놓치고 있던 혜택,<br className="lg:hidden" /> 지금 알아봐요
            </h2>
            <p className="text-[15px] lg:text-base text-[#6b7684] mb-8">
              몇 가지만 남겨주시면 대신 연구할게요
            </p>
            <Link
              href={START_HREF}
              className="inline-flex items-center gap-2 bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-white text-base font-medium px-6 py-3.5 rounded-xl transition-colors"
            >
              연구 시작하기
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

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
