'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, Search } from 'lucide-react';
import { useWishlist } from './useWishlist';

// 모바일 전용 PDP 헤더. 처음엔 이미지 위에 아이콘만 떠 있고,
// 이미지 높이만큼 스크롤하면 흰 배경 + 상품명이 나타난다. (데스크톱은 사이트 Navbar)
export default function PdpHeader({ title }: { title: string }) {
  const router = useRouter();
  const { count } = useWishlist();
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerWidth * 0.6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const iconClass = `flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
    solid ? 'text-[#333d4b]' : 'text-[#333d4b] bg-white/70 backdrop-blur-sm'
  }`;

  return (
    <header
      data-testid="pdp-header"
      data-solid={solid ? 'true' : 'false'}
      className={`lg:hidden fixed top-0 left-0 right-0 z-40 transition-colors duration-200 ${
        solid ? 'bg-white border-b border-gray-100' : 'bg-transparent'
      }`}
    >
      <div className="flex items-center gap-2 h-14 px-3">
        <button type="button" onClick={() => router.back()} aria-label="뒤로" className={iconClass}>
          <ArrowLeft className="w-5 h-5" />
        </button>

        <p
          className={`flex-1 min-w-0 text-[15px] font-bold text-[#333d4b] truncate transition-opacity duration-200 ${
            solid ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {title}
        </p>

        <Link href="/electronics/search" aria-label="검색" className={iconClass}>
          <Search className="w-5 h-5" />
        </Link>
        <Link href="/electronics/wishlist" aria-label="찜 목록" className={`relative ${iconClass}`}>
          <Heart className="w-5 h-5" />
          {count > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-[var(--action-primary)] text-white text-[9px] font-bold flex items-center justify-center">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
