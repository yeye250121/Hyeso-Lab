import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { getCategoryTree, getProductsForCategory } from '@/lib/electronicsApi';
import CategoryGrid from '@/components/electronics/CategoryGrid';
import HeroSearch from '@/components/electronics/HeroSearch';
import { POPULAR_CATEGORY_SLUGS } from '@/components/electronics/popularCategories';
import ProductCard from '@/components/electronics/ProductCard';

// 카탈로그는 실시간성이 필요 없다. 관리자 수정 시 revalidateTag 로 즉시 갱신한다.
export const revalidate = 3600;

export const metadata = {
  title: '가전 렌탈 | 혜택 연구소',
  description: '정수기·공기청정기·비데까지, 약정과 관리방법에 따라 실제로 월 얼마인지 비교해 보세요.',
};

export default async function ElectronicsHubPage() {
  const [tree, popular] = await Promise.all([
    getCategoryTree(),
    getProductsForCategory('water-purifier'),
  ]);

  // 허브는 한 줄만 보여준다. 나머지는 전체보기 타일로 /electronics/category
  // (카테고리 목차)에 넘긴다.
  const all = tree.flatMap((group) => group.children);
  const categories = POPULAR_CATEGORY_SLUGS.map((slug) =>
    all.find((c) => c.slug === slug)
  ).filter((c): c is NonNullable<typeof c> => Boolean(c));
  const top = popular.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 w-full max-w-[1100px] mx-auto px-6">
        {/* 검색 */}
        <section className="pt-8 pb-10 lg:pt-12 lg:pb-14">
          <div className="max-w-[640px] mx-auto">
            <HeroSearch />
          </div>
        </section>

        {/* 카테고리 */}
        <section className="pb-14 lg:pb-20">
          <CategoryGrid categories={categories} />
        </section>

        {/* 인기 모델 */}
        {top.length > 0 && (
          <section className="pb-16 lg:pb-24 border-t border-gray-100 pt-12 lg:pt-16">
            <div className="flex items-end justify-between mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-[#333d4b]">
                월 렌탈료가 낮은 정수기
              </h2>
              <Link
                href="/electronics/water-purifier"
                className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-[#333d4b] transition-colors shrink-0"
              >
                전체보기
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {top.map((p) => (
                <ProductCard key={p.id} product={p} categorySlug={p.category_slug} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
