import { getCategoryTree } from '@/lib/electronicsApi';
import type { GnbTab } from './ShopGnb';

// GNB 탭은 셋만 둔다: 렌탈 홈 · 카테고리 · 대표 카테고리(정수기).
// 카테고리 전체를 탭으로 늘어놓으면 목록 페이지의 원형 소분류 레일과 역할이 겹친다.
export async function buildGnbTabs(): Promise<GnbTab[]> {
  const tree = await getCategoryTree();
  const flagship = tree
    .flatMap((g) => g.children)
    .find((c) => c.slug === 'water-purifier' && c.productCount > 0);

  return [
    { label: '렌탈 홈', href: '/electronics' },
    { label: '카테고리', href: '/electronics/category' },
    ...(flagship ? [{ label: flagship.name, href: `/electronics/${flagship.slug}` }] : []),
  ];
}
