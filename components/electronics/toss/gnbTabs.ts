import { getCategoryTree } from '@/lib/electronicsApi';
import { POPULAR_CATEGORY_SLUGS } from '@/components/electronics/popularCategories';
import type { GnbTab } from './ShopGnb';

// GNB 탭: 렌탈 홈 · 카테고리 + 인기 카테고리(상품 있는 것만) 순.
// 상품이 없는 카테고리는 탭에 올리지 않는다.
export async function buildGnbTabs(): Promise<GnbTab[]> {
  const tree = await getCategoryTree();
  const all = tree.flatMap((g) => g.children).filter((c) => c.productCount > 0);

  const popular = POPULAR_CATEGORY_SLUGS.map((slug) => all.find((c) => c.slug === slug)).filter(
    (c): c is NonNullable<typeof c> => Boolean(c)
  );
  const rest = all.filter((c) => !POPULAR_CATEGORY_SLUGS.includes(c.slug as never));

  return [
    { label: '렌탈 홈', href: '/electronics' },
    { label: '카테고리', href: '/electronics/category' },
    ...[...popular, ...rest].map((c) => ({ label: c.name, href: `/electronics/${c.slug}` })),
  ];
}
