import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { getAllProducts, getCategoryTree } from '@/lib/electronicsApi';
import ProductListFilter from '@/components/electronics/ProductListFilter';
import CategoryGrid from '@/components/electronics/CategoryGrid';
import HeroSearch from '@/components/electronics/HeroSearch';
import ShopGnb from '@/components/electronics/toss/ShopGnb';
import { buildGnbTabs } from '@/components/electronics/toss/gnbTabs';
import RecentSearches from '@/components/electronics/toss/RecentSearches';

// 정적 세그먼트라 /electronics/[category] 보다 우선한다.
// 'search' 라는 슬러그를 가진 카테고리는 만들지 말 것.
export const revalidate = 3600;

export const metadata = {
  title: '렌탈 상품 검색 | 혜택 연구소',
  description: '등록된 모든 가전 렌탈 상품을 한 곳에서 검색하고 비교해 보세요.',
};

// 검색어(?q=)는 서버에서 읽지 않는다. 읽으면 정적 생성이 풀려 요청마다 서버가 돈다.
// HeroSearch·ProductListFilter·RecentSearches 가 하이드레이션 뒤에 URL 에서 직접 읽는다.
export default async function ProductSearchPage() {
  const [products, tree, tabs] = await Promise.all([
    getAllProducts(),
    getCategoryTree(),
    buildGnbTabs(),
  ]);
  const categories = tree.flatMap((g) => g.children);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <ShopGnb tabs={tabs} />

      <main className="flex-1 w-full max-w-[1100px] mx-auto px-6 pt-6 pb-24">
        <div className="max-w-[640px] mb-6">
          <HeroSearch />
        </div>

        <RecentSearches hideWhenQuery className="mb-10" />

        {products.length > 0 ? (
          <ProductListFilter
            products={products}
            filterSchema={[]}
            emptyHint={
              '아직 등록되지 않은 상품일 수 있어요.\n지금은 정수기부터 순서대로 열고 있습니다.'
            }
          />
        ) : (
          <p className="py-20 text-center text-gray-500">등록된 상품이 아직 없습니다.</p>
        )}

        <section className="mt-16 pt-12 border-t border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[#333d4b]">카테고리로 찾기</h2>
            <Link
              href="/electronics/category"
              className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-[#333d4b] transition-colors"
            >
              전체 카테고리
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <CategoryGrid categories={categories} showAll={false} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
