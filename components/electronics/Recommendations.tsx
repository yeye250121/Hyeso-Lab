import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { ProductInsights } from '@/lib/electronicsApi';
import ProductCard from './ProductCard';

// 추천. 세트 -> 유사 가격대 -> 동일 브랜드 순으로, 비어 있는 묶음은 통째로 생략한다.
//
// 모바일에서는 좌우 스와이프로 한 줄을 유지한다. 격자로 두면 4개가 두 줄로
// 접히면서 화면을 잡아먹는다. 데스크톱은 4열 격자.
export default function Recommendations({
  insights,
  categorySlug,
  categoryName,
}: {
  insights: ProductInsights | undefined;
  categorySlug: string;
  categoryName: string;
}) {
  if (!insights) return null;
  const { set, similar, sameBrand } = insights.recommendations;

  const groups = [
    { key: 'set', title: '함께 쓰면 좋은 상품', desc: '세트로 많이 찾으세요', items: set },
    { key: 'similar', title: '비슷한 가격의 다른 브랜드', desc: '같은 값이면 이런 선택지도', items: similar },
    { key: 'brand', title: '같은 브랜드의 다른 모델', desc: '', items: sameBrand },
  ].filter((g) => g.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <div key={group.key}>
          <h3 className="text-base font-bold text-[#333d4b]">{group.title}</h3>
          {group.desc && <p className="text-sm text-gray-500 mt-1">{group.desc}</p>}

          {/* 모바일: 가로 스와이프 / 데스크톱: 4열 격자 */}
          <ul
            className="mt-4 flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-6 px-6 pb-1
                       lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible lg:mx-0 lg:px-0
                       [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {group.items.map((p) => (
              <li key={p.id} className="snap-start shrink-0 w-[46%] sm:w-[31%] lg:w-auto">
                <ProductCard
                  product={{ ...p, plans: [] }}
                  categorySlug={p.category_slug}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}

      <Link
        href={`/electronics/${categorySlug}`}
        className="flex items-center justify-center gap-1 w-full py-3.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-bold text-[#333d4b] transition-colors"
      >
        {categoryName} 추천 더보기
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
