'use client';

import Image from 'next/image';
import Link from 'next/link';
import { categoryIcon } from '@/components/electronics/categoryIcons';

// 목록 페이지 상단의 원형 카테고리 선택자. 활성 = 브랜드 컬러 링 + 라벨 강조.
export type RailItem = {
  slug: string;
  name: string;
  icon_url: string | null;
};

export default function SubcategoryRail({
  items,
  activeSlug,
}: {
  items: RailItem[];
  activeSlug: string;
}) {
  return (
    <ul
      data-testid="subcategory-rail"
      className="flex gap-4 overflow-x-auto -mx-6 px-6 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
    >
      {items.map((item) => {
        const Icon = categoryIcon(item.slug);
        const active = item.slug === activeSlug;
        return (
          <li key={item.slug} className="shrink-0">
            <Link
              href={`/electronics/${item.slug}`}
              data-testid={`rail-${item.slug}`}
              aria-current={active ? 'page' : undefined}
              className="group flex flex-col items-center gap-1.5 w-[64px]"
            >
              <span
                className={`relative flex items-center justify-center w-14 h-14 rounded-full overflow-hidden bg-[#f4f5f7] transition-shadow ${
                  active ? 'ring-2 ring-[var(--action-primary)] ring-offset-2' : ''
                }`}
              >
                {item.icon_url ? (
                  <Image src={item.icon_url} alt="" fill sizes="56px" className="object-cover" />
                ) : (
                  <Icon
                    className={`w-6 h-6 ${active ? 'text-[var(--action-primary)]' : 'text-gray-400'}`}
                    strokeWidth={1.5}
                  />
                )}
              </span>
              <span
                className={`text-xs whitespace-nowrap ${
                  active ? 'font-bold text-[var(--action-primary)]' : 'font-medium text-gray-500'
                }`}
              >
                {item.name}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
