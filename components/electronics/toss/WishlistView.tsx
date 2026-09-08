'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, Package, X } from 'lucide-react';
import { useWishlist } from './useWishlist';

export default function WishlistView() {
  const { items, remove } = useWishlist();

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <Heart className="w-10 h-10 text-gray-200 mx-auto mb-4" strokeWidth={1.5} />
        <p className="font-bold text-[#333d4b]">아직 찜한 상품이 없어요</p>
        <p className="mt-1.5 text-sm text-gray-500">상품의 하트를 누르면 여기에 담겨요.</p>
        <Link
          href="/electronics"
          className="mt-6 inline-flex items-center justify-center h-11 px-6 rounded-xl bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-white text-sm font-bold transition-colors"
        >
          상품 보러가기
        </Link>
      </div>
    );
  }

  return (
    <>
      <ul data-testid="wishlist-items" className="divide-y divide-gray-100">
        {items.map((item) => (
          <li key={item.slug} className="flex items-center gap-4 py-4">
            <Link
              href={`/electronics/${item.category}/${item.slug}`}
              className="relative w-20 h-20 rounded-xl overflow-hidden bg-[#f4f5f7] shrink-0"
            >
              {item.img ? (
                <Image src={item.img} alt={item.name} fill sizes="80px" className="object-cover" />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Package className="w-6 h-6 text-gray-300" strokeWidth={1.3} />
                </span>
              )}
            </Link>

            <Link href={`/electronics/${item.category}/${item.slug}`} className="flex-1 min-w-0">
              <p className="text-sm text-[#333d4b] line-clamp-2 leading-snug">
                <span className="font-bold">{item.brand}</span> {item.name}
              </p>
              <p className="mt-1 text-[15px] font-bold text-[#333d4b]">
                월 {item.fee.toLocaleString()}원~
              </p>
            </Link>

            <button
              type="button"
              onClick={() => remove(item.slug)}
              aria-label="찜에서 삭제"
              className="p-2 rounded-full text-gray-300 hover:bg-gray-50 hover:text-gray-500 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-gray-400">
        표시된 가격은 찜한 시점 기준이라 지금과 다를 수 있어요.
      </p>
    </>
  );
}
