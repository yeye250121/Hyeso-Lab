import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { getCategoryBySlug, getCategoryTree, getProductsForCategory } from '@/lib/electronicsApi';
import ProductListFilter from '@/components/electronics/ProductListFilter';
import ShopGnb from '@/components/electronics/toss/ShopGnb';
import { buildGnbTabs } from '@/components/electronics/toss/gnbTabs';
import SubcategoryRail from '@/components/electronics/toss/SubcategoryRail';
import { categoryIcon } from '@/components/electronics/categoryIcons';

export const revalidate = 3600;

interface PageProps {
  params: { category: string };
  searchParams?: Record<string, string | string[] | undefined>;
}

function firstValue(v?: string | string[]): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export async function generateStaticParams() {
  const tree = await getCategoryTree();
  return tree.flatMap((g) => g.children.map((c) => ({ category: c.slug })));
}

export async function generateMetadata({ params }: PageProps) {
  const category = await getCategoryBySlug(params.category);
  if (!category) return {};
  return {
    title: `${category.name} 렌탈 비교 | 혜택 연구소`,
    description: `${category.name} 렌탈료를 약정기간·관리방법 조건별로 비교해 보세요.`,
  };
}

export default async function CategoryListPage({ params, searchParams }: PageProps) {
  const category = await getCategoryBySlug(params.category);
  if (!category) notFound();

  const [tabs, tree, products] = await Promise.all([
    buildGnbTabs(),
    getCategoryTree(),
    getProductsForCategory(params.category),
  ]);

  // 레일: 상품이 있는 카테고리 간 이동. 현재 카테고리는 상품이 없어도 표시한다.
  const rail = tree
    .flatMap((g) => g.children)
    .filter((c) => c.productCount > 0 || c.slug === category.slug)
    .map((c) => ({ slug: c.slug, name: c.name, icon_url: c.icon_url }));

  const Icon = categoryIcon(category.slug);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <ShopGnb tabs={tabs} />

      <main className="flex-1 w-full max-w-[1100px] mx-auto px-6 pt-4 pb-24">
        <SubcategoryRail items={rail} activeSlug={category.slug} />

        {products.length > 0 ? (
          <div className="mt-5">
            <ProductListFilter
              products={products}
              categorySlug={category.slug}
              filterSchema={category.filter_schema}
              initialQuery={firstValue(searchParams?.q)}
              initialBrand={firstValue(searchParams?.brand)}
            />
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-gray-100 bg-[#f8f9fb] px-6 py-16 text-center">
            <span className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white text-gray-300 mb-5">
              <Icon className="w-8 h-8" />
            </span>
            <p className="text-lg font-bold text-[#333d4b]">{category.name} 준비 중이에요</p>
            <p className="mt-2 text-gray-500 text-sm leading-relaxed">
              찾으시는 제품이 있다면 상담으로 먼저 알려드릴게요.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/electronics/apply?category=${category.slug}`}
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-white font-bold transition-colors w-full sm:w-auto"
              >
                <MessageCircle className="w-4 h-4" />
                {category.name} 상담 신청
              </Link>
              <Link
                href="/electronics/water-purifier"
                className="inline-flex items-center justify-center h-12 px-6 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-[#333d4b] font-bold transition-colors w-full sm:w-auto"
              >
                정수기 보러가기
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
