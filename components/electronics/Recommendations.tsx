import type { ProductInsights } from '@/lib/electronicsApi';
import ProductCard from './ProductCard';

// 추천. 세트 -> 유사 가격대 -> 동일 브랜드 순으로, 비어 있는 묶음은 통째로 생략한다.
export default function Recommendations({ insights }: { insights: ProductInsights | undefined }) {
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
          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {group.items.map((p) => (
              <ProductCard
                key={p.id}
                product={{ ...p, plans: [] }}
                categorySlug={p.category_slug}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
