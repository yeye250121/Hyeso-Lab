'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Package } from 'lucide-react';

// 렌탈 홈 "추천 제품 BEST4". 인기 카테고리 탭 → (있으면) 특징 칩 → 4개 카드 → 더보기.
// 추천 기준은 숨기지 않는다: 사진이 있는 상품 중 월 렌탈료가 낮은 순으로,
// 한 브랜드가 독점하지 않게 브랜드별 1개씩 먼저 뽑고 모자라면 나머지로 채운다.

export type Best4Product = {
  slug: string;
  category_slug: string;
  brand: string;
  display_name: string;
  image: string;
  minFee: number;
  listPrice: number | null;
  /** 칩 판별용. 스펙 몇 개와 이름만 내려보낸다 */
  tags: string[];
};

export type Best4Tab = {
  slug: string;
  name: string;
  products: Best4Product[];
  chips: { key: string; label: string }[];
};

const PICK = 4;

function pickBest(products: Best4Product[]) {
  const sorted = [...products].sort((a, b) => a.minFee - b.minFee);
  const out: Best4Product[] = [];
  const brands = new Set<string>();
  for (const p of sorted) {
    if (out.length >= PICK) break;
    if (brands.has(p.brand)) continue;
    brands.add(p.brand);
    out.push(p);
  }
  for (const p of sorted) {
    if (out.length >= PICK) break;
    if (!out.includes(p)) out.push(p);
  }
  return out;
}

export default function Best4({ tabs }: { tabs: Best4Tab[] }) {
  const [tabSlug, setTabSlug] = useState(tabs[0]?.slug);
  const [chip, setChip] = useState<string | null>(null);
  const tab = tabs.find((t) => t.slug === tabSlug) ?? tabs[0];

  const items = useMemo(() => {
    if (!tab) return [];
    const pool = chip ? tab.products.filter((p) => p.tags.includes(chip)) : tab.products;
    return pickBest(pool);
  }, [tab, chip]);

  if (!tab) return null;

  return (
    <section data-testid="best4">
      <h2 className="text-xl font-semibold text-[#333d4b]">추천 제품 BEST4</h2>

      {/* 카테고리 탭 */}
      <div className="mt-4 flex overflow-x-auto -mx-6 px-6 border-b border-gray-100 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {tabs.map((t) => {
          const active = t.slug === tab.slug;
          return (
            <button
              key={t.slug}
              type="button"
              onClick={() => {
                setTabSlug(t.slug);
                setChip(null);
              }}
              aria-selected={active}
              role="tab"
              data-testid={`best4-tab-${t.slug}`}
              className={`shrink-0 px-4 py-3 -mb-px border-b-2 text-[15px] font-semibold transition-colors ${
                active
                  ? 'border-[var(--action-primary)] text-[var(--action-primary)]'
                  : 'border-transparent text-gray-400 hover:text-[#4e5968]'
              }`}
            >
              {t.name}
            </button>
          );
        })}
      </div>

      {/* 특징 칩. 가로 스크롤 영역은 세로로 넘친 부분도 잘라서, 선택 테두리가 들어갈 위아래 여백(py-1)을 둔다 */}
      {tab.chips.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto -mx-6 px-6 py-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {[{ key: '', label: '전체' }, ...tab.chips].map((c) => {
            const active = (chip ?? '') === c.key;
            return (
              <button
                key={c.key || 'all'}
                type="button"
                onClick={() => setChip(c.key || null)}
                aria-pressed={active}
                data-testid={`best4-chip-${c.key || 'all'}`}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[#fff1f5] text-[var(--action-primary)] ring-1 ring-[#ff9ebb]'
                    : 'bg-[#f2f4f6] text-[#4e5968] hover:bg-[#eceef1]'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      )}

      {/* 카드: 모바일은 가로 스와이프, 데스크톱은 4열 */}
      <ul
        data-testid="best4-cards"
        className="mt-5 flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-pl-6 -mx-6 px-6 pb-1 lg:scroll-pl-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
      >
        {items.map((p) => {
          const discounted = p.listPrice && p.listPrice > p.minFee ? p.listPrice : null;
          return (
            <li key={p.slug} className="shrink-0 w-[44vw] max-w-[200px] snap-start lg:w-auto lg:max-w-none">
              <Link href={`/electronics/${p.category_slug}/${p.slug}`} className="group block" data-testid="best4-card">
                <span className="relative block aspect-square rounded-2xl bg-[#f4f5f7] overflow-hidden">
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={p.display_name}
                      fill
                      sizes="(max-width: 1024px) 44vw, 25vw"
                      className="object-contain p-4 mix-blend-multiply transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <Package className="absolute inset-0 m-auto w-9 h-9 text-gray-300" strokeWidth={1.3} />
                  )}
                </span>
                <span className="mt-2.5 block text-xs text-gray-400">{p.brand}</span>
                <span className="mt-0.5 block text-sm font-medium text-[#333d4b] leading-snug line-clamp-2">
                  {p.display_name}
                </span>
                <span className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
                  {discounted && (
                    <del className="text-xs text-gray-400">월 {discounted.toLocaleString()}원</del>
                  )}
                  <strong className="text-[15px] font-semibold text-[#333d4b]">월 {p.minFee.toLocaleString()}원~</strong>
                </span>
              </Link>
            </li>
          );
        })}
        {items.length === 0 && (
          <li className="w-full py-10 text-center text-sm text-gray-400">조건에 맞는 제품이 아직 없어요.</li>
        )}
      </ul>

      <Link
        href={`/electronics/${tab.slug}`}
        data-testid="best4-more"
        className="mt-6 flex items-center justify-center gap-1 h-12 rounded-xl bg-[#f2f4f6] hover:bg-[#eceef1] text-[15px] font-medium text-[#333d4b] transition-colors"
      >
        {tab.name} 제품 더보기
        <ChevronRight className="w-4 h-4" />
      </Link>
    </section>
  );
}
