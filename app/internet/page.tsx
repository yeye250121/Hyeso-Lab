import Link from 'next/link';
import { ChevronRight, Headset, Search, Wifi } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import BannerCarousel, { type BannerSlide } from '@/components/electronics/toss/BannerCarousel';
import CircleShortcuts from '@/components/electronics/toss/CircleShortcuts';
import CarrierGrid from '@/components/internet/CarrierGrid';
import InternetNotes from '@/components/internet/InternetNotes';
import { getCarriers, getInternetProducts } from '@/lib/internetApi';

export const revalidate = 3600;

export const metadata = {
  title: '인터넷 가입 | 혜택 연구소',
  description: 'KT·LG U+·SK 인터넷과 TV를 통신사별로 비교하고, 조건을 고르면 월 요금과 사은품을 바로 확인하세요.',
};

const SHORTCUTS = [
  { label: '상담 신청', href: '/apply?service=internet', icon: Headset },
  { label: '요금제 추천', href: '/internet/recommend', icon: Wifi },
];

export default async function InternetHubPage() {
  const [carriers, products] = await Promise.all([getCarriers(), getInternetProducts()]);

  const consumer = products.filter((p) => !carriers.find((c) => c.id === p.carrier_id)?.business_only);
  const cheapest = consumer.length ? consumer.reduce((m, p) => (p.monthly_fee < m.monthly_fee ? p : m)) : null;
  const cheapestCarrier = cheapest ? carriers.find((c) => c.id === cheapest.carrier_id) : null;

  // 배너는 실데이터 기반 문구만 쓴다
  const slides: BannerSlide[] = [
    {
      eyebrow: `통신사 ${carriers.filter((c) => !c.business_only).length}곳 비교 중`,
      title: '통신사만 고르면\n월 요금과 사은품이 바로 보여요',
      caption: '로그인 없이 조건만 고르고 신청까지 끝나요',
      href: '#carriers',
      bg: 'bg-[#f0f7ff]',
    },
    ...(cheapest && cheapestCarrier
      ? [
          {
            eyebrow: '오늘 기준 최저 요금',
            title: `인터넷 단독 월 ${cheapest.monthly_fee.toLocaleString()}원부터`,
            caption: `${cheapestCarrier.name} ${cheapest.speed} · 3년 약정 기준`,
            href: `/internet/${cheapestCarrier.id}?addon=${cheapest.addon_type}&speed=${cheapest.speed}`,
            bg: 'bg-[#fff1f5]',
          },
        ]
      : []),
    {
      eyebrow: '고르기 어려우면',
      title: '몇 가지만 답하면\n딱 맞는 요금제를 골라드려요',
      caption: '몇 명이 쓰는지, TV를 보는지만 알려주세요',
      href: '/internet/recommend',
      bg: 'bg-[#f4f5f7]',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 w-full max-w-[1100px] mx-auto px-6 pb-24">
        <section className="pt-4">
          <BannerCarousel slides={slides} />
        </section>

        <section className="pt-8">
          <CircleShortcuts items={SHORTCUTS} align="left" />
        </section>

        <section id="carriers" className="pt-10 scroll-mt-20">
          <CarrierGrid carriers={carriers} />
        </section>

        <section className="pt-12">
          <h2 className="text-xl font-bold text-[#333d4b]">내게 딱 맞는 요금제 비교</h2>
          <Link
            href="/internet/recommend"
            data-testid="recommend-entry"
            className="mt-4 flex items-center gap-4 rounded-2xl bg-[#f4f5f7] px-5 py-5 transition-colors hover:bg-[#eceef1]"
          >
            <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#e8f3ff] shrink-0">
              <Search className="w-6 h-6 text-[#3182f6]" strokeWidth={2.2} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[16px] font-bold text-[#333d4b]">나에게 맞는 상품 찾기</span>
              <span className="mt-0.5 block text-[13px] text-gray-500">빠르게 추천받는 맞춤 요금제</span>
            </span>
            <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
          </Link>
        </section>

        <section className="pt-14">
          <InternetNotes compact />
        </section>
      </main>

      <Footer />
    </div>
  );
}
