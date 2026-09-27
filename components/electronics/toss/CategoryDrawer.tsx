'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { CategoryNode } from '@/lib/electronicsApi';
import { categoryIcon } from '@/components/electronics/categoryIcons';

// 좌측 대분류 사이드바 + 우측 원형 썸네일 섹션. 사이드바를 누르면 해당 섹션으로
// 스크롤하고, 스크롤하면 지나는 섹션이 사이드바에서 활성화된다(스크롤 스파이).
const NAV_OFFSET = 132; // ShopGnb(sticky) 높이 보정

export default function CategoryDrawer({ groups }: { groups: CategoryNode[] }) {
  const [active, setActive] = useState(groups[0]?.slug);
  const lockUntil = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      if (Date.now() < lockUntil.current) return;
      let current = groups[0]?.slug;
      for (const g of groups) {
        const el = document.getElementById(`cat-group-${g.slug}`);
        if (el && el.getBoundingClientRect().top <= NAV_OFFSET + 12) current = g.slug;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [groups]);

  const go = (slug: string) => {
    const el = document.getElementById(`cat-group-${slug}`);
    if (!el) return;
    lockUntil.current = Date.now() + 700;
    setActive(slug);
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET,
      behavior: 'smooth',
    });
  };

  return (
    <div className="flex gap-5">
      {/* 좌측 사이드바 */}
      <nav className="w-[92px] shrink-0" data-testid="category-sidebar">
        <ul className="sticky top-[118px] space-y-1">
          {groups.map((g) => (
            <li key={g.slug}>
              <button
                type="button"
                onClick={() => go(g.slug)}
                data-testid={`category-side-${g.slug}`}
                aria-current={active === g.slug ? 'true' : undefined}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-[15px] leading-tight break-keep transition-colors ${
                  active === g.slug
                    ? 'bg-gray-100 font-bold text-[#191f28]'
                    : 'text-gray-500 hover:text-[#333d4b]'
                }`}
              >
                {g.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* 우측 섹션들 */}
      <div className="flex-1 min-w-0 space-y-10 pb-10">
        {groups.map((g) => (
          <section key={g.slug} id={`cat-group-${g.slug}`} className="scroll-mt-36">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#333d4b]">{g.name}</h2>
              {g.children.length > 0 && (
                <Link
                  href={`/electronics/${g.children[0].slug}`}
                  className="inline-flex items-center text-[13px] font-medium text-gray-400 hover:text-[#333d4b] transition-colors"
                >
                  전체보기
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            <ul className="grid grid-cols-3 gap-x-2 gap-y-5">
              {g.children.map((cat) => {
                const Icon = categoryIcon(cat.slug);
                return (
                  <li key={cat.slug}>
                    <Link
                      href={`/electronics/${cat.slug}`}
                      data-testid={`category-circle-${g.slug}-${cat.slug}`}
                      className="group flex flex-col items-center gap-2"
                    >
                      <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#f4f5f7] overflow-hidden transition-colors group-hover:bg-[#eceef1]">
                        {cat.icon_url ? (
                          <Image src={cat.icon_url} alt="" fill sizes="56px" className="object-contain p-2 mix-blend-multiply" />
                        ) : (
                          <Icon className="w-7 h-7 text-gray-400" strokeWidth={1.4} />
                        )}
                      </span>
                      <span className="text-xs font-medium text-[#333d4b] text-center leading-tight break-keep">
                        {cat.name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
