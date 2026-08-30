import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { getAllProducts, getCategoryTree } from '@/lib/electronicsApi';
import ProductListFilter from '@/components/electronics/ProductListFilter';
import CategoryGrid from '@/components/electronics/CategoryGrid';
import HeroSearch from '@/components/electronics/HeroSearch';

// 정적 세그먼트라 /electronics/[category] 보다 우선한다.
// 'category' 라는 슬러그를 가진 카테고리는 만들지 말 것.
export const revalidate = 3600;

export const metadata = {
  title: '전체 렌탈 상품 | 혜택 연구소',
  description: '등록된 모든 가전 렌탈 상품을 한 곳에서 검색하고 비교해 보세요.',
};

interface PageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

function firstValue(v?: string | string[]): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AllProductsPage({ searchParams }: PageProps) {
  const [products, tree] = await Promise.all([getAllProducts(), getCategoryTree()]);
  const query = firstValue(searchParams?.q);
  const categories = tree.flatMap((g) => g.children);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 w-full max-w-[1100px] mx-auto px-6 pt-8 pb-24">
        <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
          <Link href="/electronics" className="hover:text-[#333d4b] transition-colors">
            가전 렌탈
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#333d4b] font-medium">전체보기</span>
        </nav>

        <div className="max-w-[640px] mb-10">
          <HeroSearch defaultValue={query ?? ''} />
        </div>

        {products.length > 0 ? (
          <ProductListFilter
            products={products}
            filterSchema={[]}
            initialQuery={query}
            emptyHint={
              '아직 등록되지 않은 상품일 수 있어요.\n지금은 정수기부터 순서대로 열고 있습니다.'
            }
          />
        ) : (
          <p className="py-20 text-center text-gray-500">등록된 상품이 아직 없습니다.</p>
        )}

        <section className="mt-16 pt-12 border-t border-gray-100">
          <h2 className="text-lg font-bold text-[#333d4b] mb-6">카테고리로 찾기</h2>
          <CategoryGrid categories={categories} showAll={false} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
