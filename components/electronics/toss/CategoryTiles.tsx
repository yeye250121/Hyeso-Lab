import Image from 'next/image';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { CategoryNode } from '@/lib/electronicsApi';
import { categoryIcon } from '@/components/electronics/categoryIcons';

// 허브 하단 카테고리: 연회색 정사각 타일에 대표 이미지 + 이름. 마지막 타일은 전체보기.
export default function CategoryTiles({ categories }: { categories: CategoryNode[] }) {
  const tile = 'flex items-center justify-center aspect-square rounded-2xl bg-[#f4f5f7] overflow-hidden transition-colors group-hover:bg-[#eceef1]';
  return (
    <ul className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-7 gap-x-3 gap-y-5" data-testid="category-tiles">
      {categories.map((c) => {
        const Icon = categoryIcon(c.slug);
        return (
          <li key={c.slug}>
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
