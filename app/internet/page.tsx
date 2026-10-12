import { Headset, Store, Wifi } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import BannerCarousel, { type BannerSlide } from '@/components/electronics/toss/BannerCarousel';
import CircleShortcuts from '@/components/electronics/toss/CircleShortcuts';
import CarrierGrid from '@/components/internet/CarrierGrid';
import QuickRecommend from '@/components/internet/QuickRecommend';
import InternetNotes from '@/components/internet/InternetNotes';
import { getCarriers, getInternetProducts } from '@/lib/internetApi';

export const revalidate = 3600;

export const metadata = {
  title: '인터넷 가입 | 혜택 연구소',
  description: 'KT·LG U+·SK 인터넷과 TV를 통신사별로 비교하고, 조건을 고르면 월 요금과 사은품을 바로 확인하세요.',
};

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
      title: '두 가지만 답하면\n딱 맞는 요금제를 골라드려요',
      caption: '몇 명이 쓰는지, TV를 보는지만 알려주세요',
      href: '#recommend',
      bg: 'bg-[#f4f5f7]',
    },
  ];

  const SHORTCUTS = [
    { label: '상담 신청', href: '/apply?service=internet', icon: Headset },
    { label: '요금제 추천', href: '#recommend', icon: Wifi },
    { label: '사업자 인터넷', href: '/internet/lg-soho', icon: Store },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 w-full max-w-[1100px] mx-auto px-6 pb-24">
        <section className="pt-4">
          <BannerCarousel slides={slides} />
        </section>

        <section className="pt-8">
          <CircleShortcuts items={SHORTCUTS} />
        </section>

        <section id="carriers" className="pt-12 scroll-mt-20">
          <h2 className="text-xl font-bold text-[#333d4b]">통신사 선택</h2>
          <p className="mt-1 text-sm text-gray-500">통신사를 고르면 속도와 TV 조건을 바로 설정할 수 있어요.</p>
          <div className="mt-5">
            <CarrierGrid carriers={carriers} products={products} />
          </div>
        </section>

        <section id="recommend" className="pt-14 scroll-mt-20">
          <h2 className="text-xl font-bold text-[#333d4b]">딱 맞는 요금제 추천</h2>
          <p className="mt-1 text-sm text-gray-500">두 가지만 알려주시면 통신사별 최저 요금을 한 번에 비교해 드려요.</p>
          <div className="mt-5">
            <QuickRecommend carriers={carriers} products={products} />
          </div>
        </section>

        <section className="pt-14">
          <InternetNotes compact />
        </section>
      </main>

      <Footer />
    </div>
  );
}
