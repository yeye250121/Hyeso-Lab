'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Headset, Heart, Search } from 'lucide-react';
import { useWishlist } from './useWishlist';

// 가전렌탈 섹션 공용 상단. 검색바를 누르면 검색 화면으로 가고,
// 탭은 가로 스크롤(활성 = 회색 알약)이다. sticky 라 스크롤해도 남는다.
export type GnbTab = { label: string; href: string };

export default function ShopGnb({ tabs }: { tabs: GnbTab[] }) {
  const pathname = usePathname();
  const { count } = useWishlist();

  const isActive = (href: string) =>
    href === '/electronics' ? pathname === '/electronics' : pathname.startsWith(href);

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-[1100px] mx-auto px-6">
        {/* 검색바 + 아이콘 */}
        <div className="flex items-center gap-4 pt-3 pb-2.5">
          <Link
            href="/electronics/search"
            data-testid="gnb-search"
            className="flex-1 flex items-center gap-2.5 h-[46px] px-4 rounded-xl bg-gray-100 text-gray-400 text-[15px] transition-colors hover:bg-gray-200/70"
          >
            <Search className="w-4 h-4 shrink-0" />
            어떤 가전을 찾으세요?
          </Link>

          <div className="flex items-center gap-4 shrink-0">
            <Link href="/apply" aria-label="상담 신청" className="text-[#333d4b]">
              <Headset className="w-6 h-6" strokeWidth={1.7} />
            </Link>
            <Link
              href="/electronics/wishlist"
              aria-label="찜 목록"
              data-testid="gnb-wish"
              className="relative text-[#333d4b]"
            >
              <Heart className="w-6 h-6" strokeWidth={1.7} />
              {count > 0 && (
                <span
                  data-testid="gnb-wish-badge"
                  className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[var(--action-primary)] text-white text-[10px] font-bold flex items-center justify-center"
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* 카테고리 탭 */}
        <nav
          data-testid="gnb-tabs"
          className="flex items-center gap-1 -mx-2 px-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                data-testid={`gnb-tab-${tab.href.split('/').pop() || 'home'}`}
                aria-current={active ? 'page' : undefined}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-[15px] whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-gray-100 font-bold text-[#191f28]'
                    : 'font-medium text-gray-500 hover:text-[#333d4b]'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
