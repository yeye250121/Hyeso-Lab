import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { getCategoryTree } from '@/lib/electronicsApi';
import CategoryGrid from '@/components/electronics/CategoryGrid';
import { POPULAR_CATEGORY_SLUGS } from '@/components/electronics/popularCategories';

// 상품 카테고리 목차. 상품은 보여주지 않고, 누르면 /electronics/{슬러그} 로 간다.
//
// 정적 세그먼트라 /electronics/[category] 보다 우선한다.
// 'category' 라는 슬러그를 가진 카테고리는 만들지 말 것(영영 가려진다).
export const revalidate = 3600;

export const metadata = {
  title: '전체 카테고리 | 혜택 연구소',
  description: '가전 렌탈 카테고리를 한눈에 보고 원하는 상품군으로 이동하세요.',
};

export default async function CategoryIndexPage() {
  const tree = await getCategoryTree();
  const all = tree.flatMap((g) => g.children);

  // "인기"는 허브 첫 줄과 같은 목록을 쓴다. 목차에서도 자주 찾는 것을 위에 둔다.
  const popular = POPULAR_CATEGORY_SLUGS.map((slug) => all.find((c) => c.slug === slug)).filter(
    (c): c is NonNullable<typeof c> => Boolean(c)
  );

  const groups = [
    ...(popular.length > 0 ? [{ slug: 'popular', name: '인기', children: popular }] : []),
    ...tree.filter((g) => g.children.length > 0),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 w-full max-w-[1100px] mx-auto px-6 pt-8 pb-24">
        <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
          <Link href="/electronics" className="hover:text-[#333d4b] transition-colors">
            가전 렌탈
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#333d4b] font-medium">전체 카테고리</span>
        </nav>

        <h1 className="text-2xl lg:text-3xl font-bold text-[#333d4b] mb-10">전체 카테고리</h1>

        <div className="space-y-12">
          {groups.map((group) => (
            <section key={group.slug}>
              <h2 className="text-base font-bold text-[#333d4b] mb-5">{group.name}</h2>
              <CategoryGrid categories={group.children} showAll={false} />
            </section>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
