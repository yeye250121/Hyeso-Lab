import Image from 'next/image';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { CategoryNode } from '@/lib/electronicsApi';
import { categoryIcon } from '@/components/electronics/categoryIcons';
import { POPULAR_CATEGORY_SLUGS } from '@/components/electronics/popularCategories';

// 허브 하단 카테고리: 연회색 정사각 타일에 대표 이미지 + 이름. 마지막 타일은 전체보기.
// 두 줄만 보인다: 모바일 4열(카테고리 7 + 전체보기), sm 5열(9 + 전체보기), 데스크톱 7열(13 + 전체보기). 나머지는 전체보기로.
// 순서는 인기 카테고리(POPULAR_CATEGORY_SLUGS) 먼저, 그다음 상품 수 많은 순.
const ROWS = 2;
const COLS = { base: 4, sm: 5, lg: 7 };

export default function CategoryTiles({ categories }: { categories: CategoryNode[] }) {
  const tile = 'flex items-center justify-center aspect-square rounded-2xl bg-[#f4f5f7] overflow-hidden transition-colors group-hover:bg-[#eceef1]';
  const rank = (c: CategoryNode) => {
    const i = (POPULAR_CATEGORY_SLUGS as readonly string[]).indexOf(c.slug);
    return i === -1 ? POPULAR_CATEGORY_SLUGS.length : i;
  };
  const ordered = [...categories].sort((a, b) => rank(a) - rank(b) || b.productCount - a.productCount);
  const shown = ordered.slice(0, COLS.lg * ROWS - 1);
  // 뷰포트별로 두 줄을 넘는 타일은 숨긴다(전체보기 자리 하나 남김)
  const hideAt = (i: number) => [i >= COLS.base * ROWS - 1 && 'max-sm:hidden', i >= COLS.sm * ROWS - 1 && 'sm:max-lg:hidden'].filter(Boolean).join(' ');
  return (
    <ul className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-7 gap-x-3 gap-y-5" data-testid="category-tiles">
      {shown.map((c, i) => {
        const Icon = categoryIcon(c.slug);
        return (
          <li key={c.slug} className={hideAt(i)}>
            <Link href={`/electronics/${c.slug}`} className="group flex flex-col items-center gap-2">
              <span className={`relative w-full ${tile}`}>
                {c.icon_url ? (
                  <Image src={c.icon_url} alt="" fill sizes="(min-width: 1024px) 140px, 25vw" className="object-contain p-3 mix-blend-multiply" />
                ) : (
                  <Icon className="w-8 h-8 text-gray-400" strokeWidth={1.4} />
                )}
              </span>
              <span className="text-[13px] font-medium text-[#333d4b] text-center leading-tight break-keep">{c.name}</span>
            </Link>
          </li>
        );
      })}
      <li>
        <Link href="/electronics/category" className="group flex flex-col items-center gap-2">
          <span className={`w-full ${tile}`}>
            <Plus className="w-7 h-7 text-gray-400" strokeWidth={1.6} />
          </span>
          <span className="text-[13px] font-medium text-[#333d4b] text-center leading-tight">전체보기</span>
        </Link>
      </li>
    </ul>
  );
}
