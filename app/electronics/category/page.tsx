import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { getCategoryTree } from '@/lib/electronicsApi';
import ShopGnb from '@/components/electronics/toss/ShopGnb';
import { buildGnbTabs } from '@/components/electronics/toss/gnbTabs';
import CategoryDrawer from '@/components/electronics/toss/CategoryDrawer';
import { POPULAR_CATEGORY_SLUGS } from '@/components/electronics/popularCategories';

// 카테고리 목차(서랍). 좌측 대분류 사이드바 + 우측 원형 썸네일 그리드.
//
// 정적 세그먼트라 /electronics/[category] 보다 우선한다.
// 'category' 라는 슬러그를 가진 카테고리는 만들지 말 것(영영 가려진다).
export const revalidate = 3600;

export const metadata = {
  title: '전체 카테고리 | 혜택 연구소',
  description: '가전 렌탈 카테고리를 한눈에 보고 원하는 상품군으로 이동하세요.',
};

export default async function CategoryIndexPage() {
  const [tabs, tree] = await Promise.all([buildGnbTabs(), getCategoryTree()]);
  const all = tree.flatMap((g) => g.children);

  // "인기" 그룹은 허브 첫 줄과 같은 목록을 쓴다
  const popular = POPULAR_CATEGORY_SLUGS.map((slug) => all.find((c) => c.slug === slug)).filter(
    (c): c is NonNullable<typeof c> => Boolean(c)
  );

  const groups = [
    ...(popular.length > 0
      ? [{ ...tree[0], id: 'popular', slug: 'popular', name: '인기', children: popular }]
      : []),
    ...tree.filter((g) => g.children.length > 0),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <ShopGnb tabs={tabs} />
      <main className="flex-1 w-full max-w-[1100px] mx-auto px-6 pt-6 pb-16">
        <CategoryDrawer groups={groups} />
      </main>
      {/* 목차 화면은 사이드바 스크롤 스파이가 끝까지 이어져야 해서 푸터를 두지 않는다 */}
      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  );
}
