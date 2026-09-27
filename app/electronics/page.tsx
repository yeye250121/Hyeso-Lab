import Link from 'next/link';
import { Headset, Heart, LayoutGrid, Sparkles } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { getAllProducts, getCategoryTree } from '@/lib/electronicsApi';
import ShopGnb from '@/components/electronics/toss/ShopGnb';
import { buildGnbTabs } from '@/components/electronics/toss/gnbTabs';
import BannerCarousel, { type BannerSlide } from '@/components/electronics/toss/BannerCarousel';
import CircleShortcuts from '@/components/electronics/toss/CircleShortcuts';
import Best4, { type Best4Tab } from '@/components/electronics/toss/Best4';
import { POPULAR_CATEGORY_SLUGS } from '@/components/electronics/popularCategories';

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

  // BEST4 탭: 인기 카테고리 중 상품이 있는 것만. 칩은 스펙·상품명으로 판별한다.
  const CHIPS: Record<string, { key: string; label: string; test: (p: (typeof products)[number]) => boolean }[]> = {
    'water-purifier': [
      { key: 'hot', label: '냉/온수', test: (p) => /온/.test(p.specs.purifyFunction ?? '') },
      { key: 'ice', label: '얼음', test: (p) => /얼음/.test(p.specs.purifyFunction ?? '') },
      { key: 'direct', label: '직수', test: (p) => p.specs.waterType === '직수형' },
      { key: 'stand', label: '스탠드', test: (p) => p.specs.productType === '스탠드형' },
    ],
    'air-conditioner': [
      { key: 'wall', label: '벽걸이', test: (p) => /벽걸이/.test(p.display_name) },
      { key: 'stand', label: '스탠드', test: (p) => /스탠드/.test(p.display_name) },
    ],
    'air-purifier': [
      { key: 'small', label: '20평 이하', test: (p) => ['10평 이하', '10~20평'].includes(p.specs.coverageBucket ?? '') },
      { key: 'mid', label: '20~30평', test: (p) => p.specs.coverageBucket === '20~30평' },
      { key: 'large', label: '30평 이상', test: (p) => p.specs.coverageBucket === '30평 이상' },
    ],
  };
  const best4Tabs: Best4Tab[] = POPULAR_CATEGORY_SLUGS.flatMap((slug) => {
    const cat = categories.find((c) => c.slug === slug);
    if (!cat) return [];
    const pool = products.filter((p) => p.category_slug === slug && p.image_urls?.[0]);
    const chipDefs = (CHIPS[slug] ?? []).filter((c) => pool.some(c.test));
    return [
      {
        slug,
        name: cat.name,
        chips: chipDefs.length >= 2 ? chipDefs.map(({ key, label }) => ({ key, label })) : [],
        products: pool.map((p) => ({
          slug: p.slug,
          category_slug: p.category_slug,
          brand: p.brand,
          display_name: p.display_name,
          image: p.image_urls[0],
          minFee: p.minFee,
          listPrice: p.listPrice,
          tags: chipDefs.filter((c) => c.test(p)).map((c) => c.key),
        })),
      },
    ];
  });

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

        {best4Tabs.length > 0 && (
          <div className="pt-12">
            <Best4 tabs={best4Tabs} />
          </div>
        )}

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
