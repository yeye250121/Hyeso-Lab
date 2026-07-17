import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { Search, ChevronRight, ChevronLeft, CreditCard } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Mock Data
const topCashbacks = [
  { name: 'KB국민카드', benefit: '최대 86만원', bg: 'bg-transparent', image: 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/icons/app/card/kb-cardlogo-icon.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvaWNvbnMvYXBwL2NhcmQva2ItY2FyZGxvZ28taWNvbi5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg0Mjg0NTk4LCJleHAiOjE4MTU4MjA1OTh9.5YgXQ11bzYJu_O4BooIpaCgNQdqVYq4Fnqc-aSb9XOg' },
  { name: '신한카드', benefit: '최대 74만원', bg: 'bg-transparent', image: 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/icons/app/card/shinhan-cardlogo-icon.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvaWNvbnMvYXBwL2NhcmQvc2hpbmhhbi1jYXJkbG9nby1pY29uLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODQyODQ1OTgsImV4cCI6MTgxNTgyMDU5OH0.cy5YrmFdOUjjIhrdzk6ahk8iQdSxPCIEu_m6iB7TMH4' },
  { name: '우리카드', benefit: '통신/렌탈 할인', bg: 'bg-transparent', image: 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/icons/app/card/woori-cardlogo-icon.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvaWNvbnMvYXBwL2NhcmQvd29vcmktY2FyZGxvZ28taWNvbi5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg0Mjg0NTk4LCJleHAiOjE4MTU4MjA1OTh9.uAO5hASJ7AcczAwnZTHHktlczLmWPELGYIbm4NR9C3c' },
  { name: '현대카드', benefit: '최대 75만원', bg: 'bg-transparent', image: 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/icons/app/card/hyundai-cardlogo-icon.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvaWNvbnMvYXBwL2NhcmQvaHl1bmRhaS1jYXJkbG9nby1pY29uLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODQyODQ1OTksImV4cCI6MTgxNTgyMDU5OX0.dkqkXbOP8JBzoh7aLN3ctouyO-X9_PeWdcxddbRKgmE' },
  { name: '삼성카드', benefit: '최대 36.5만원', bg: 'bg-transparent', image: 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/icons/app/card/samsung-cardlogo-icon.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvaWNvbnMvYXBwL2NhcmQvc2Ftc3VuZy1jYXJkbG9nby1pY29uLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODQyODQ1OTksImV4cCI6MTgxNTgyMDU5OX0.Fi1TybKjKi0szbyAFOie7FZHsqvk8f5HqsKV1TdYFxU' },
  { name: 'NH농협카드', benefit: '최대 26.5만원', bg: 'bg-transparent', image: 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/icons/app/card/nh-cardlogo-icon.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvaWNvbnMvYXBwL2NhcmQvbmgtY2FyZGxvZ28taWNvbi5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg0Mjg0NTk5LCJleHAiOjE4MTU4MjA1OTl9._1v91AB-oBQDftFlsGklRmE5c2Wjr2f-1GsWiGcrA-o' },
  { name: 'KB국민(체크)', benefit: '최대 3만원', bg: 'bg-transparent', image: 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/icons/app/card/kb_heartyouping_check-cardlogo-icon.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvaWNvbnMvYXBwL2NhcmQva2JfaGVhcnR5b3VwaW5nX2NoZWNrLWNhcmRsb2dvLWljb24ucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4NDI4NDU5OSwiZXhwIjoxODE1ODIwNTk5fQ.hVXVPbGdfyfJNku3SDfiwFmEw8775i2nuay3YwSr2vM' },
];

const regularCards = [
  { name: 'KB국민 굿데이카드', desc: '주유/통신/커피 할인', bg: 'bg-gradient-to-br from-blue-400 to-blue-600' },
  { name: '청년도약계좌 우대금리', desc: '최대 86만원 캐시백', bg: 'bg-gradient-to-br from-orange-400 to-orange-600' },
  { name: '코웨이 렌탈 할인카드', desc: '매월 최대 4.2만원 혜택', bg: 'bg-gradient-to-br from-gray-200 to-gray-400' },
  { name: 'Triple in LOCA', desc: '생활업종 최대 3만원 할인', bg: 'bg-gradient-to-br from-rose-300 to-rose-500' },
  { name: 'BC 바로 클리어 플러스', desc: '휴대폰요금/스트리밍 10% 할인', bg: 'bg-gradient-to-br from-red-400 to-red-600' },
];

const recommendedCards = [
  { name: '신한카드 Mr.Life', desc: '공과금/할인 혜택', category: '생활', bg: 'bg-gradient-to-b from-red-500 to-red-700' },
  { name: 'taptap O', desc: 'OTT·멤버십 50% 할인', category: '디지털/구독', bg: 'bg-gradient-to-b from-gray-100 to-gray-300' },
  { name: 'LOCA 365', desc: '관리비·보험·교육 할인', category: '공과금/관리비', bg: 'bg-gradient-to-b from-orange-300 to-orange-500' },
  { name: '올바른 FLEX 카드', desc: '청년도약계좌 우대금리', category: '카페/디저트', bg: 'bg-gradient-to-b from-blue-300 to-blue-500' },
  { name: '에너지플러스 현대카드', desc: '최대 60만원 혜택 제공', category: '주유', bg: 'bg-gradient-to-b from-green-500 to-green-700' },
];

const cardCompanies = [
  { name: '신한카드', color: 'text-[#0046ff]', logo: 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/logos/app/card/shinhan-card-logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvbG9nb3MvYXBwL2NhcmQvc2hpbmhhbi1jYXJkLWxvZ28ucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4NDI4NDU5OSwiZXhwIjoxODE1ODIwNTk5fQ.qQd-7o_prZqtzCAUK0sJbEjTpeHBxFrLMYW7CaIDRXQ' },
  { name: '현대카드', color: 'text-black', logo: 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/logos/app/card/hyundai-card-logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvbG9nb3MvYXBwL2NhcmQvaHl1bmRhaS1jYXJkLWxvZ28ucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4NDI4NDU5OSwiZXhwIjoxODE1ODIwNTk5fQ.6aTAbKsBQYBWKgZYj6s0UoGkFlUIplMo4dL04TCJMVY' },
  { name: '롯데카드', color: 'text-[#ed1c24]', logo: 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/logos/app/card/lotte-card-logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvbG9nb3MvYXBwL2NhcmQvbG90dGUtY2FyZC1sb2dvLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODQyODQ2MDAsImV4cCI6MTgxNTgyMDYwMH0._gtyK5BbC410WRX_dhjYmStt4cdfO_BCJiLOz9Odg58' },
  { name: '삼성카드', color: 'text-[#0f62fe]', logo: 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/logos/app/card/samsung-card-logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvbG9nb3MvYXBwL2NhcmQvc2Ftc3VuZy1jYXJkLWxvZ28ucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4NDI4NDYwMCwiZXhwIjoxODE1ODIwNjAwfQ.wTd1_s0mNuqh-jIhvpHYtFllOLu7zdSoQ2Qid-KOwFY' },
  { name: '하나카드', color: 'text-[#009384]', logo: 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/logos/app/card/hana-card-logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvbG9nb3MvYXBwL2NhcmQvaGFuYS1jYXJkLWxvZ28ucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4NDI4NDYwMCwiZXhwIjoxODE1ODIwNjAwfQ.VkMYrQhiEsaW2CCbRc6DHrGwFuXy0fyx0Qz7b5EHmVo' },
  { name: 'KB국민카드', color: 'text-[#645c4c]', logo: 'https://i.namu.wiki/i/27HLrlwQWd6UyINsNSHg85uHiLUcw_BxvN51R6uT3BPbwlN9FaqGFbDL-cqj1VIEsxomk-0T7DSudxPqfn_0LQ.svg' },
  { name: 'BC카드', color: 'text-[#ed1c24]', logo: 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/logos/app/card/bc-card-logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvbG9nb3MvYXBwL2NhcmQvYmMtY2FyZC1sb2dvLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODQyODQ2MDAsImV4cCI6MTgxNTgyMDYwMH0.YcPOaJVIbLyJIyipP8O3ILeScgVeW655VPIH6gj0g4M' },
  { name: '우리카드', color: 'text-[#0078d7]', logo: 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/logos/app/card/woori-card-logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvbG9nb3MvYXBwL2NhcmQvd29vcmktY2FyZC1sb2dvLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODQyODQ2MDAsImV4cCI6MTgxNTgyMDYwMH0.U0b8ebyHyCMwvge62dcqm7CFWp2s3nU9Syum4rHvlY0' },
  { name: 'NH농협카드', color: 'text-[#009b4d]', logo: 'https://i.namu.wiki/i/NRx2sGZQx0nmZg0ceOGaR4VsK1ESprdayF8d40LAFYn8Lv3adn9qTJFP-pvCLn5c3ZUNgNL05Hyglj4--iMX6w.svg' },
];

export default function CardPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pb-12">
        {/* Full Width Top Section (Search + Cashbacks) */}
        <div className="w-full bg-[#f4f5f7] pt-12 pb-14 mb-12">
          {/* Search Bar Area */}
          <div className="max-w-[1100px] mx-auto px-6 mb-12">
            <form action="/card/list/all-card" method="GET" className="max-w-2xl mx-auto relative">
              <input
                type="text"
                name="q"
                placeholder="원하는 카드나 혜택을 검색해 보세요"
                className="w-full h-14 pl-6 pr-12 rounded-full border border-gray-300 focus:outline-none focus:border-[var(--action-primary)] focus:ring-1 focus:ring-[var(--action-primary)] shadow-sm text-lg placeholder-gray-400 bg-white"
              />
              <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-[var(--action-primary)]">
                <Search className="w-6 h-6" />
              </button>
            </form>
          </div>

          <section className="max-w-[1100px] mx-auto px-6">
            <div className="flex items-center gap-2 mb-8 cursor-pointer group">
              <div>
                <p className="text-sm text-gray-500 mb-1">연구한 혜택을 받아보세요!</p>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-1 group-hover:text-[var(--action-primary)] transition-colors">
                  최대 86만원 캐시백 받기 <ChevronRight className="w-5 h-5" />
                </h2>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-6">
              {topCashbacks.map((card, idx) => (
                <div key={idx} className="flex flex-row-reverse md:flex-col items-center justify-between md:justify-start gap-4 cursor-pointer group bg-white md:bg-transparent p-3 md:p-0 rounded-xl md:rounded-none transition-all border-0">
                  <div className={`relative w-12 h-16 md:w-16 md:h-24 shrink-0 ${card.bg} rounded-md md:rounded-lg transform md:group-hover:-translate-y-2 transition-transform duration-300 overflow-hidden`}>
                    {card.image && (
                      <Image src={card.image} alt={card.name} width={64} height={96} className="w-full h-full object-cover object-center" />
                    )}
                  </div>
                  <div className="text-left md:text-center flex-1 w-full pl-2 md:pl-0">
                    <p className="text-[14px] text-[var(--action-primary)] md:text-gray-500 mb-1 font-semibold md:font-normal">{card.benefit}</p>
                    <p className="text-[17px] md:text-[15px] font-bold md:font-semibold text-gray-900">{card.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Rest of the Content */}
        <div className="max-w-[1100px] mx-auto px-6">
          {/* AI Custom Card Recommendation CTA */}
          <section className="mb-8">
            <Link href="/card/recommend" className="block w-full bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] rounded-3xl p-8 text-center transition-all transform hover:-translate-y-1 shadow-lg">
              <p className="text-white/90 text-sm md:text-base mb-2 font-medium">
                내 소비에 맞는 카드 맞춤카드
              </p>
              <h3 className="text-2xl md:text-3xl font-bold text-white flex items-center justify-center gap-2">
                AI로 연구하기 <Search className="w-6 h-6 md:w-7 md:h-7" />
              </h3>
            </Link>
          </section>

          {/* Advertisement Banner Section (Placeholder) */}
          <section className="relative bg-[#f8f9fa] border-2 border-dashed border-gray-200 rounded-3xl p-8 md:p-12 mb-16 flex flex-col items-center justify-center min-h-[200px]">
            <h3 className="text-xl font-bold text-gray-500 mb-2">
              광고 영역 (자동 롤링 배너)
            </h3>
            <p className="text-gray-400 text-sm">
              ※ 실제 서비스 시 자동으로 넘어가는 배너 광고판이 위치할 곳입니다.
            </p>
          </section>

          {/* Regular Cards Section */}
          <section className="mb-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">정기결제 할인 받으세요!</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
              {regularCards.map((card, idx) => (
                <div key={idx} className="flex flex-col items-center group cursor-pointer">
                  <div className="relative w-40 h-40 bg-[#f8f9fa] rounded-full flex items-center justify-center mb-6 overflow-visible group-hover:bg-pink-50 transition-colors">
                    {/* Fake Card Graphic */}
                    <div className={`absolute w-16 h-24 ${card.bg} rounded-lg shadow-lg border border-white/20 transform group-hover:-translate-y-4 group-hover:rotate-6 transition-all duration-300`} />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">{card.desc}</p>
                  <p className="font-semibold text-gray-900 text-center leading-tight">{card.name}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <Link href="/card/list/all-card" className="px-6 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                전체카드 보기
              </Link>
            </div>
          </section>

          {/* Recommended Cards Section */}
          <section className="mb-20">
            <div className="mb-8">
              <p className="text-sm text-gray-500 mb-1">카드 고르기 어려우셨죠?</p>
              <h2 className="text-2xl font-bold text-gray-900">이달의 추천 카드</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
              {recommendedCards.map((card, idx) => (
                <div key={idx} className="flex flex-col items-center group cursor-pointer">
                  <h4 className="text-lg font-bold text-gray-900 mb-6">{card.category}</h4>
                  <div className="relative w-40 h-40 bg-[#f8f9fa] rounded-full flex items-center justify-center mb-6 overflow-visible group-hover:bg-pink-50 transition-colors">
                    <div className={`absolute w-16 h-24 ${card.bg} rounded-lg shadow-lg border border-white/20 transform group-hover:-translate-y-4 group-hover:-rotate-6 transition-all duration-300`} />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">{card.name}</p>
                  <p className="font-semibold text-gray-900 text-center leading-tight">{card.desc}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <Link href="/card/list/all-card" className="px-6 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                신용카드 더보기
              </Link>
            </div>
          </section>

          {/* Card Companies */}
          <section className="mb-20">
            <div className="flex items-center gap-1 cursor-pointer group w-fit mb-6">
              <h2 className="text-2xl font-bold text-gray-900 group-hover:text-[var(--action-primary)] transition-colors">
                카드사 모아보기
              </h2>
              <ChevronRight className="w-6 h-6 text-gray-900 group-hover:text-[var(--action-primary)] transition-colors" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {cardCompanies.map((company, idx) => (
                <div 
                  key={idx} 
                  className="bg-[#f8f9fa] hover:bg-gray-100 h-16 rounded-xl flex items-center justify-center cursor-pointer transition-colors px-4"
                >
                  {company.logo ? (
                    <div className="w-full h-full flex items-center justify-center py-3">
                      <img src={company.logo} alt={company.name} className="max-w-[120px] max-h-full object-contain" />
                    </div>
                  ) : (
                    <span className={`font-bold text-lg ${company.color} flex items-center gap-2`}>
                      <CreditCard className="w-5 h-5 opacity-70" />
                      {company.name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Bottom CTA Banner */}
          <section>
            <Link href="/card/recommend" className="block w-full bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] rounded-2xl p-6 text-center transition-colors">
              <h3 className="text-xl font-bold text-white mb-1">
                내게 딱 맞는 맞춤 카드 찾기 !
              </h3>
              <p className="text-white/90 text-sm">
                원하는 혜택 선택하고 나에게 맞는 카드찾기 →
              </p>
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
