import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, MessageCircle } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { getCategoryBySlug, getCategoryTree, getProductsForCategory } from '@/lib/electronicsApi';
import ProductListFilter from '@/components/electronics/ProductListFilter';
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

  const products = await getProductsForCategory(params.category);
  const Icon = categoryIcon(category.slug);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 w-full max-w-[1100px] mx-auto px-6 pt-8 pb-24">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
          <Link href="/electronics" className="hover:text-[#333d4b] transition-colors">
            가전 렌탈
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#333d4b] font-medium">{category.name}</span>
        </nav>

        <div className="flex items-center gap-4 mb-8">
          <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#fff1f5] text-[var(--action-primary)] shrink-0">
            <Icon className="w-7 h-7" />
          </span>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#333d4b]">{category.name} 렌탈</h1>
            <p className="text-gray-500 text-sm mt-1">
              {products.length > 0
                ? `${products.length}개 모델의 조건별 렌탈료를 비교합니다.`
                : '아직 등록된 모델이 없어요.'}
            </p>
          </div>
        </div>

        {products.length > 0 ? (
          <ProductListFilter
            products={products}
            categorySlug={category.slug}
            filterSchema={category.filter_schema}
            initialQuery={firstValue(searchParams?.q)}
            initialBrand={firstValue(searchParams?.brand)}
          />
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-[#f8f9fb] px-6 py-16 text-center">
            <span className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white text-gray-300 mb-5">
              <Icon className="w-8 h-8" />
            </span>
            <p className="text-lg font-bold text-[#333d4b]">{category.name} 준비 중이에요</p>
            <p className="mt-2 text-gray-500 text-sm leading-relaxed">
              지금은 정수기부터 순서대로 열고 있어요.
              <br />
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
