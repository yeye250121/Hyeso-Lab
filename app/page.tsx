'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import Footer from '@/components/shared/Footer'
import Navbar from '@/components/shared/Navbar'

const LOGO_URL = 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/logos/hyeso-lab_logo_pic_text_black.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvbG9nb3MvaHllc28tbGFiX2xvZ29fcGljX3RleHRfYmxhY2sucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4NDI4NDYwMCwiZXhwIjoxODE1ODIwNjAwfQ.HOfatTrz3hEPzY4QQqFdycndnVzoBOQJHBuj-gSiKPI'
const NAV_LOGO_URL = 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/logos/hyeso-lab_logo_pic_text_black.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvbG9nb3MvaHllc28tbGFiX2xvZ29fcGljX3RleHRfYmxhY2sucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4NDI4NDYwMCwiZXhwIjoxODE1ODIwNjAwfQ.HOfatTrz3hEPzY4QQqFdycndnVzoBOQJHBuj-gSiKPI'

export default function PartnersLandingPage() {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const sliderRef = useRef<HTMLDivElement>(null)

  const handleSliderScroll = () => {
    if (!sliderRef.current) return
    const scrollLeft = sliderRef.current.scrollLeft
    const cardWidth = sliderRef.current.children[0]?.clientWidth || 280
    const gap = 24 // 6 * 4px
    const index = Math.round(scrollLeft / (cardWidth + gap))
    setActiveSlide(index)
  }

  const scrollToSlide = (index: number) => {
    if (!sliderRef.current) return
    const child = sliderRef.current.children[index] as HTMLElement
    if (child) {
      child.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    
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

    return () => {
      observerRef.current?.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sticky Navigation */}
      <Navbar />

      {/* Hero Section with integrated Navigation */}
      <section className="relative bg-gray-50 min-h-[600px] flex flex-col overflow-hidden -mt-16">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-[133.33%] object-cover object-top opacity-80 pointer-events-none"
        >
          <source src="https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/videos/hyeso-lab_herosectionvideo.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvdmlkZW9zL2h5ZXNvLWxhYl9oZXJvc2VjdGlvbnZpZGVvLm1wNCIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODQyODQ2MDAsImV4cCI6MTgxNTgyMDYwMH0.V83z-zWuvE1EPdJiNEX4o1Sg0HlY780HwSd_E8NqRTU" type="video/mp4" />
        </video>

        {/* Video Gradient Fade & Blur Overlay */}
        <div className="absolute inset-0 pointer-events-none backdrop-blur-md [mask-image:linear-gradient(to_bottom,black_0%,transparent_10%,transparent_90%,black_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,transparent_10%,transparent_90%,black_100%)]" />
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,#f9fafb_0%,transparent_10%,transparent_90%,#f9fafb_100%)]" />
        


        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 pt-16 lg:pt-20">
          <div className="max-w-[1100px] mx-auto px-6 text-center w-full pointer-events-auto">
          <div className="animate-on-scroll opacity-0 translate-y-12 transition-all duration-700">
            <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight mb-6 drop-shadow-md">
              내가 받을 혜택<br />연구해드려요
            </h1>
            <p className="text-[#4e5968] text-lg lg:text-xl max-w-2xl mx-auto mb-10">
              혜택연구소가 대신 연구해서 찾아드려요
            </p>
            <Link
              href="/partners/login"
              className="inline-flex items-center gap-2 bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-white text-lg font-semibold px-8 py-4 rounded-xl transition-all hover:scale-105"
            >
              연구 시작하기
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="pt-24 lg:pt-32 pb-16 lg:pb-20 bg-gray-50">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center mb-10 lg:mb-14 animate-on-scroll opacity-0 translate-y-12 transition-all duration-700">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#333d4b]">
              어떤 혜택을 연구해 볼까요?
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 max-w-[280px] md:max-w-[600px] mx-auto">
            {[
              { 
                id: 'card', 
                title: '카드 연구',
                icon: 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/icons/card_icon.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvaWNvbnMvY2FyZF9pY29uLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODQyODQ2MDAsImV4cCI6MTgxNTgyMDYwMH0.knGFkRUBNInxhVgjHrdhyv7nVugkbJN5C9AdljnED7k'
              },
              { 
                id: 'phone', 
                title: '휴대폰 연구',
                icon: 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/icons/phone_icon.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvaWNvbnMvcGhvbmVfaWNvbi5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg0Mjg0NjAxLCJleHAiOjE4MTU4MjA2MDF9.e9Z0P57kS6Y6pzmeWLn9yrCYBbOOqRtkT19LUxDJbAQ'
              },
              { 
                id: 'internet', 
                title: '인터넷 연구',
                icon: 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/icons/internet_icon.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvaWNvbnMvaW50ZXJuZXRfaWNvbi5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg0Mjg0NjAxLCJleHAiOjE4MTU4MjA2MDF9.41jUWee7UFdYD9x3HI4eaRU0hHcx0jziDdd_WEJNzQc'
              },
              { 
                id: 'cctv', 
                title: 'CCTV 연구',
                icon: 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/icons/cctv_icon.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvaWNvbnMvY2N0dl9pY29uLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODQyODQ2MDEsImV4cCI6MTgxNTgyMDYwMX0.3fQdue-9q417l6EU6aeyMuW2u4bxQlpaHBJgfdtJUPc'
              },
            ].map((product) => (
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
                <h3 className="text-lg lg:text-xl font-medium text-[#333d4b] whitespace-nowrap">
                  {product.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center mb-16 lg:mb-24 animate-on-scroll opacity-0 translate-y-12 transition-all duration-700">
            <h2 className="text-3xl lg:text-4xl font-bold text-[#333d4b]">
              이런 고민,<br />한 번쯤 해보셨나요?
            </h2>
          </div>

          {/* Benefit Cards Slider (Mobile) / Grid (Desktop) */}
          <div 
            ref={sliderRef}
            onScroll={handleSliderScroll}
            className="flex lg:grid lg:grid-cols-3 gap-6 overflow-x-auto snap-x snap-mandatory px-6 lg:px-0 pb-4 lg:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {/* Card 1 */}
            <div className="flex-none w-[280px] sm:w-[320px] lg:w-auto h-[360px] lg:h-[420px] rounded-[32px] bg-gradient-to-t from-gray-200/80 to-gray-50 flex flex-col items-center text-center pt-10 px-6 snap-center animate-on-scroll opacity-0 translate-y-12 transition-all duration-700">
              <div className="mb-auto">
                <h3 className="text-xl lg:text-2xl font-bold text-[#333d4b] mb-4 leading-tight">
                  지원금은 도대체<br />
                  어떻게 받는거지?
                </h3>
                <p className="text-[15px] lg:text-base text-[#4e5968] leading-relaxed">
                  혜택 연구소가 최대 혜택으로<br />대신 연구해드릴게요.
                </p>
              </div>
              <div className="relative w-full h-[140px] lg:h-[180px] flex items-end justify-center pb-6">
                <Image
                  src="https://hvwgs4k77hcs8ntu.public.blob.vercel-storage.com/blooom_money_icon_v01.png"
                  alt="지원금 아이콘"
                  width={240}
                  height={240}
                  className="w-32 h-32 lg:w-40 lg:h-40 object-contain scale-[1.2] origin-bottom"
                />
              </div>
            </div>

            {/* Card 2 */}
            <div className="flex-none w-[280px] sm:w-[320px] lg:w-auto h-[360px] lg:h-[420px] rounded-[32px] bg-gradient-to-t from-gray-200/80 to-gray-50 flex flex-col items-center text-center pt-10 px-6 snap-center animate-on-scroll opacity-0 translate-y-12 transition-all duration-700" style={{ animationDelay: '100ms' }}>
              <div className="mb-auto">
                <h3 className="text-xl lg:text-2xl font-bold text-[#333d4b] mb-4 leading-tight">
                  넘치는 선택지에<br />
                  많은 시간을 낭비해요.
                </h3>
                <p className="text-[15px] lg:text-base text-[#4e5968] leading-relaxed">
                  인터넷 하나만 해도<br />상품도 요금제도 다양한걸요.
                </p>
              </div>
              <div className="relative w-full h-[140px] lg:h-[180px] flex items-end justify-center pb-6">
                <Image
                  src="https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/icons/select-pbl_icon%20(2).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvaWNvbnMvc2VsZWN0LXBibF9pY29uICgyKS5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg0Mjg0NjAxLCJleHAiOjE4MTU4MjA2MDF9.Buk00z4VfGSSIvsEfdUQ6NLcXemakLydvixjYKvoLsM"
                  alt="선택지 아이콘"
                  width={240}
                  height={240}
                  className="w-32 h-32 lg:w-40 lg:h-40 object-contain scale-[1.2] origin-bottom"
                />
              </div>
            </div>

            {/* Card 3 */}
            <div className="flex-none w-[280px] sm:w-[320px] lg:w-auto h-[360px] lg:h-[420px] rounded-[32px] bg-gradient-to-t from-gray-200/80 to-gray-50 flex flex-col items-center text-center pt-10 px-6 snap-center animate-on-scroll opacity-0 translate-y-12 transition-all duration-700" style={{ animationDelay: '200ms' }}>
              <div className="mb-auto">
                <h3 className="text-xl lg:text-2xl font-bold text-[#333d4b] mb-4 leading-tight">
                  믿을만 한 곳인지<br />
                  걱정돼요.
                </h3>
                <p className="text-[15px] lg:text-base text-[#4e5968] leading-relaxed">
                  약속한 혜택은 언제쯤<br />받을 수 있을까요?
                </p>
              </div>
              <div className="relative w-full h-[140px] lg:h-[180px] flex items-end justify-center pb-6">
                <Image
                  src="https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/icons/trust_icon.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvaWNvbnMvdHJ1c3RfaWNvbi5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg0Mjg0NjAxLCJleHAiOjE4MTU4MjA2MDF9.nSpypk8IJasl5s_VeDNIpQaa0601FPmOZVWBbrCSVyE"
                  alt="걱정 아이콘"
                  width={240}
                  height={240}
                  className="w-32 h-32 lg:w-40 lg:h-40 object-contain scale-[1.2] origin-bottom"
                />
              </div>
            </div>
          </div>

          {/* Mobile Pagination Dots */}
          <div className="flex justify-center gap-2 mt-4 lg:hidden">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                onClick={() => scrollToSlide(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeSlide === i ? 'bg-red-600 w-6' : 'bg-gray-300 w-2 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="relative bg-gray-50 pt-16 lg:pt-24 pb-48 lg:pb-56">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center animate-on-scroll opacity-0 translate-y-12 transition-all duration-700 mb-12 lg:mb-16">
            <h3 className="text-2xl lg:text-3xl font-bold text-[#333d4b] leading-tight mb-4">
              필요한 것만<br />딱 골라서 해요
            </h3>
            <p className="text-lg lg:text-xl text-[#4e5968]">
              혜택 연구소가 귀찮은 건 다 해드릴게요.
            </p>
          </div>
        </div>
        {/* 이미지 - 하단이 Support 섹션 하단(=CTA 상단)과 일치 */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 z-10 flex items-end">
          <Image
            src="https://hvwgs4k77hcs8ntu.public.blob.vercel-storage.com/blooom_a_man_looking_phone_icon_v02.png"
            alt="폰을 보는 사람"
            width={320}
            height={320}
            className="w-56 h-56 lg:w-72 lg:h-72 object-contain object-bottom"
          />
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
