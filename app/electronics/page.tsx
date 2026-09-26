import Link from 'next/link';
import { ChevronRight, Headset, Heart, LayoutGrid, Sparkles } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { getAllProducts, getCategoryTree } from '@/lib/electronicsApi';
import ShopGnb from '@/components/electronics/toss/ShopGnb';
import { buildGnbTabs } from '@/components/electronics/toss/gnbTabs';
import BannerCarousel, { type BannerSlide } from '@/components/electronics/toss/BannerCarousel';
import CircleShortcuts from '@/components/electronics/toss/CircleShortcuts';
import ProductCardV2 from '@/components/electronics/toss/ProductCardV2';

// 카탈로그는 실시간성이 필요 없다. 관리자 수정 시 revalidateTag 로 즉시 갱신한다.
export const revalidate = 3600;

export const metadata = {
  title: '가전 렌탈 | 혜택 연구소',
  description: '정수기·공기청정기·비데까지, 약정과 관리방법에 따라 실제로 월 얼마인지 비교해 보세요.',
};

const SHORTCUTS = [
  { label: '상담 신청', href: '/apply', icon: Headset },
  { label: '전체 카테고리', href: '/electronics/category', icon: LayoutGrid },
  { label: '찜 목록', href: '/electronics/wishlist', icon: Heart },
  { label: '인기 정수기', href: '/electronics/water-purifier', icon: Sparkles },
];

export default async function ElectronicsHubPage() {
  const [tabs, tree, products] = await Promise.all([
    buildGnbTabs(),
    getCategoryTree(),
    getAllProducts(),
  ]);

  const categories = tree.flatMap((g) => g.children).filter((c) => c.productCount > 0);

  // 배너는 실데이터 기반 문구만 쓴다(광고 소재 없음)
  const cheapest = products[0];
  const slides: BannerSlide[] = [
    {
      eyebrow: `렌탈 상품 ${products.length}개 비교 중`,
      title: '월 렌탈료만 보지 말고\n총 납부액까지 확인하세요',
      caption: '약정·관리방법 조건별 실제 가격을 보여드려요',
      href: '/electronics/category',
      bg: 'bg-[#fff1f5]',
    },
    ...(cheapest
      ? [
          {
            eyebrow: '오늘 기준 최저가',
            title: `${cheapest.category_name} 월 ${cheapest.minFee.toLocaleString()}원부터`,
            caption: `${cheapest.brand} ${cheapest.display_name}`,
            href: `/electronics/${cheapest.category_slug}/${cheapest.slug}`,
            bg: 'bg-[#f4f5f7]',
          },
        ]
      : []),
    {
      eyebrow: '찜 기능',
      title: '고민되는 상품은\n하트를 눌러 담아두세요',
      caption: '찜 목록에서 한 번에 다시 비교할 수 있어요',
      href: '/electronics/wishlist',
      bg: 'bg-[#f0f7ff]',
    },
  ];

  // "지금 할인 큰 렌탈": 실제 할인율(정가 대비) 순. 허수 지표를 만들지 않는다.
  const discountRate = (p: (typeof products)[number]) =>
    p.listPrice ? 1 - p.minFee / p.listPrice : 0;
  const discounted = [...products]
    .filter((p) => p.listPrice && p.listPrice > p.minFee)
    .sort((a, b) => discountRate(b) - discountRate(a))
    .slice(0, 8);
  const cheapestByFee = [...products].sort((a, b) => a.minFee - b.minFee).slice(0, 8);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <ShopGnb tabs={tabs} />

      <main className="flex-1 w-full max-w-[1100px] mx-auto px-6 pb-24">
        <section className="pt-4">
          <BannerCarousel slides={slides} />
        </section>

        <section className="pt-8">
          <CircleShortcuts items={SHORTCUTS} />
        </section>

        <section className="pt-12">
          <div className="flex items-end justify-between mb-5">
            <h2 className="text-xl font-bold text-[#333d4b]">지금 할인 큰 렌탈</h2>
            <Link
              href="/electronics/search"
              className="inline-flex items-center gap-0.5 text-sm font-medium text-gray-500 hover:text-[#333d4b] transition-colors"
            >
              더보기
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-7">
            {discounted.map((p, i) => (
              <ProductCardV2 key={p.id} product={p} priority={i < 2} />
            ))}
          </div>
        </section>

        <section className="pt-14">
          <div className="flex items-end justify-between mb-5">
            <h2 className="text-xl font-bold text-[#333d4b]">월 렌탈료 낮은 순</h2>
            <Link
              href="/electronics/water-purifier"
              className="inline-flex items-center gap-0.5 text-sm font-medium text-gray-500 hover:text-[#333d4b] transition-colors"
            >
              더보기
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-7">
            {cheapestByFee.map((p) => (
              <ProductCardV2 key={p.id} product={p} />
            ))}
          </div>
        </section>

        <section className="pt-14">
          <h2 className="text-xl font-bold text-[#333d4b] mb-5">카테고리</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/electronics/${c.slug}`}
                className="px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-300 hover:text-[#333d4b] transition-colors"
              >
                {c.name} <span className="text-gray-400">{c.productCount}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
