import Image from 'next/image';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { CategoryNode } from '@/lib/electronicsApi';
import { categoryIcon } from './categoryIcons';

// 회색 박스 안에 제품 이미지를 가운데 두고 라벨을 아래에 붙인 격자.
// 카테고리 이미지는 electronics_categories.icon_url 로 채우고,
// 아직 없는 카테고리는 lucide 아이콘으로 대체한다.

export default function CategoryGrid({
  categories,
  showAll = true,
}: {
  categories: CategoryNode[];
  showAll?: boolean;
}) {
  return (
    <ul className="grid grid-cols-4 sm:grid-cols-8 gap-x-3 gap-y-6">
      {categories.map((cat) => {
        const Icon = categoryIcon(cat.slug);
        const ready = cat.productCount > 0;
        return (
          <li key={cat.slug}>
            <Link href={`/electronics/${cat.slug}`} className="group block text-center">
              <span className="relative block aspect-square rounded-2xl bg-[#f4f5f7] overflow-hidden transition-colors group-hover:bg-[#eceef1]">
                {cat.icon_url ? (
                  <Image
                    src={cat.icon_url}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 25vw, (max-width: 1024px) 16vw, 12vw"
                    className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Icon
                      className={`w-8 h-8 lg:w-9 lg:h-9 ${ready ? 'text-gray-400' : 'text-gray-300'}`}
                      strokeWidth={1.3}
                    />
                  </span>
                )}
              </span>
              <span className="mt-2.5 block text-[13px] lg:text-sm font-medium text-[#333d4b] leading-snug group-hover:text-[var(--action-primary)] transition-colors">
                {cat.name}
              </span>
            </Link>
          </li>
        );
      })}

      {showAll && (
        <li>
          <Link href="/electronics/category" className="group block text-center">
            <span className="flex aspect-square rounded-2xl bg-[#f4f5f7] items-center justify-center transition-colors group-hover:bg-[#eceef1]">
              <Plus className="w-8 h-8 text-gray-400" strokeWidth={1.3} />
            </span>
            <span className="mt-2.5 block text-[13px] lg:text-sm font-medium text-[#333d4b] leading-snug group-hover:text-[var(--action-primary)] transition-colors">
              전체보기
            </span>
          </Link>
        </li>
      )}
    </ul>
  );
}
