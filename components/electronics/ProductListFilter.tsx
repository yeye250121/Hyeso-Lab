'use client';

import { useMemo, useState } from 'react';
import { Package, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import type { FilterAxis, ProductListItem, ProductSpecs } from '@/lib/electronicsApi';
import ProductCardV2 from './toss/ProductCardV2';

// 목록 필터. 화면 위에는 "총 N개 + 상세 필터 버튼"만 두고, 약정·관리·정렬을
// 포함한 모든 조건은 바텀시트 안에 모은다. 시트 안 각 필터는 줄바꿈 없이
// 한 줄 가로 스와이프로 유지해 항목이 많아도 길어지지 않는다.
//
// 가격 재계산은 서버가 내려준 요약(약정 x 관리방법 -> 최저가)만으로 한다.
// 요금제 원본(정수기만 2,897행)을 클라이언트로 보내지 않으려는 설계다.

const PAGE_SIZE = 24;

const CARE_TYPES = ['방문관리', '자가관리', '관리없음'] as const;

type SortKey = 'fee-asc' | 'fee-desc' | 'name';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'fee-asc', label: '월 렌탈료 낮은순' },
  { key: 'fee-desc', label: '월 렌탈료 높은순' },
  { key: 'name', label: '이름순' },
];

function monthsLabel(m: number) {
  return m % 12 === 0 ? `${m / 12}년` : `${m}개월`;
}

export default function ProductListFilter({
  products,
  categorySlug,
  filterSchema,
  initialQuery,
  initialBrand,
  emptyHint,
}: {
  products: ProductListItem[];
  /** 없으면 카테고리를 가로지르는 전체 목록으로 동작한다(검색 페이지). */
  categorySlug?: string;
  filterSchema: FilterAxis[];
  initialQuery?: string;
  initialBrand?: string;
  emptyHint?: string;
}) {
  // 검색어는 검색 페이지의 검색창(?q=)에서만 들어온다. 목록 안 검색창은 없앴다.
  const [query, setQuery] = useState(initialQuery ?? '');
  const [brand, setBrand] = useState<string | null>(initialBrand ?? null);
  const [contract, setContract] = useState<number | null>(null);
  const [care, setCare] = useState<string | null>(null);
  const [specFilters, setSpecFilters] = useState<Record<string, string>>({});
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('fee-asc');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [sheetOpen, setSheetOpen] = useState(false);

  // 실제 데이터에 존재하는 값만 필터로 노출한다
  const brands = useMemo(
    () => [...new Set(products.map((p) => p.brand))].sort((a, b) => a.localeCompare(b, 'ko')),
    [products]
  );
  const contracts = useMemo(
    () => [...new Set(products.flatMap((p) => p.plans.map((s) => s.c)))].sort((a, b) => a - b),
    [products]
  );
  const cares = useMemo(() => {
    const found = new Set(products.flatMap((p) => p.plans.map((s) => s.t)).filter(Boolean));
    return CARE_TYPES.filter((c) => found.has(c));
  }, [products]);

  // 전체 목록(검색)에서는 카테고리 필터를 추가로 보여준다
  const categories = useMemo(() => {
    if (categorySlug) return [];
    const seen = new Map<string, string>();
    for (const p of products) if (p.category_slug) seen.set(p.category_slug, p.category_name);
    return [...seen.entries()].map(([slug, name]) => ({ slug, name }));
  }, [products, categorySlug]);

  const availableSpecs = useMemo(
    () =>
      filterSchema
        .map((axis) => ({
          ...axis,
          options: axis.options.filter((opt) =>
            products.some((p) => p.specs[axis.key as keyof ProductSpecs] === opt)
          ),
        }))
        .filter((axis) => axis.options.length > 0),
    [filterSchema, products]
  );

  const activeCount =
    (brand ? 1 : 0) +
    (contract ? 1 : 0) +
    (care ? 1 : 0) +
    Object.keys(specFilters).length +
    (category ? 1 : 0) +
    (query.trim() ? 1 : 0);

  const reset = () => {
    setQuery('');
    setBrand(null);
    setContract(null);
    setCare(null);
    setSpecFilters({});
    setCategory(null);
    setVisible(PAGE_SIZE);
  };

  // 선택한 약정/관리방법에 해당하는 최저가를 다시 구한다.
  // 조건에 맞는 요금제가 없는 제품은 목록에서 빠진다.
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    const result = products
      .map((p) => {
        const matching = p.plans.filter(
          (s) => (contract === null || s.c === contract) && (care === null || s.t === care)
        );
        if (matching.length === 0) return null;
        const fee = Math.min(...matching.map((s) => s.f));
        return { product: p, fee, months: contract };
      })
      .filter((r): r is { product: ProductListItem; fee: number; months: number | null } => r !== null)
      .filter(({ product }) => {
        if (category && product.category_slug !== category) return false;
        if (brand && product.brand !== brand) return false;
        for (const [key, value] of Object.entries(specFilters)) {
          if (product.specs[key as keyof ProductSpecs] !== value) return false;
        }
        if (q) {
          const hay = `${product.display_name} ${product.brand} ${product.model_code}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });

    result.sort((a, b) => {
      if (sort === 'fee-asc') return a.fee - b.fee;
      if (sort === 'fee-desc') return b.fee - a.fee;
      return a.product.display_name.localeCompare(b.product.display_name, 'ko');
    });
    return result;
  }, [products, query, brand, contract, care, specFilters, category, sort]);

  const shown = rows.slice(0, visible);

  const chip = (active: boolean) =>
    `shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all border ${
      active
        ? 'border-[var(--action-primary)] bg-[#fff1f5] text-[var(--action-primary)]'
        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
    }`;

  const toggleSpec = (key: string, opt: string) =>
    setSpecFilters((prev) => {
      const next = { ...prev };
      if (next[key] === opt) delete next[key];
      else next[key] = opt;
      return next;
    });

  return (
    <div className="w-full">
      {/* 결과 수 + 상세 필터 버튼. 나머지 조건은 전부 시트 안에 있다 */}
      <div className="flex items-center justify-between gap-3 py-3 border-y border-gray-100">
        <p className="text-sm text-gray-500 shrink-0">
          총 <span className="font-bold text-[#333d4b]">{rows.length}</span>개
          <span className="ml-2 text-xs text-gray-400">
            {SORTS.find((s) => s.key === sort)?.label}
          </span>
        </p>

        <button
          type="button"
          data-testid="open-filter-sheet"
          onClick={() => setSheetOpen(true)}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          상세 필터
          {activeCount > 0 && (
            <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--action-primary)] text-white text-[11px] font-bold">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* 적용된 필터 */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 py-3">
          {query.trim() && <FilterPill label={`"${query.trim()}"`} onRemove={() => setQuery('')} />}
          {category && (
            <FilterPill
              label={categories.find((c) => c.slug === category)?.name ?? category}
              onRemove={() => setCategory(null)}
            />
          )}
          {brand && <FilterPill label={brand} onRemove={() => setBrand(null)} />}
          {contract !== null && (
            <FilterPill label={monthsLabel(contract)} onRemove={() => setContract(null)} />
          )}
          {care && <FilterPill label={care} onRemove={() => setCare(null)} />}
          {Object.entries(specFilters).map(([k, v]) => (
            <FilterPill key={k} label={v} onRemove={() => toggleSpec(k, v)} />
          ))}
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-[#333d4b] transition-colors ml-1"
          >
            <RotateCcw className="w-3 h-3" />
            초기화
          </button>
        </div>
      )}

      {/* 목록 */}
      {shown.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-10 h-10 text-gray-200 mx-auto mb-4" strokeWidth={1.5} />
          <p className="font-bold text-[#333d4b]">상품을 찾을 수 없습니다</p>
          <p className="text-gray-500 text-sm mt-1.5 leading-relaxed whitespace-pre-line">
            {emptyHint ?? '조건에 맞는 제품이 없어요. 필터를 조금 풀어보시겠어요?'}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-5 inline-flex items-center gap-1.5 h-10 px-5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-bold text-[#333d4b] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            필터 초기화
          </button>
        </div>
      ) : (
        <>
          <ul className="mt-2 grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-7">
            {shown.map(({ product, fee, months }) => (
              <li key={product.id}>
                <ProductCardV2 product={product} fee={fee} contractMonths={months} />
              </li>
            ))}
          </ul>

          {visible < rows.length && (
            <button
              type="button"
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
              className="mt-8 w-full py-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-bold text-[#333d4b] transition-colors"
            >
              {Math.min(PAGE_SIZE, rows.length - visible)}개 더보기
              <span className="text-gray-400 font-medium"> ({visible}/{rows.length})</span>
            </button>
          )}
        </>
      )}

      {/* 상세 필터 바텀시트 — 모든 조건이 여기에 모인다 */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div
            data-testid="filter-sheet"
            className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto animate-[sheetUp_.25s_ease-out]"
          >
            <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#333d4b]">상세 필터</h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="닫기"
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="py-5 space-y-5">
              <ChipRow label="정렬">
                {SORTS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    data-testid={`sort-${s.key}`}
                    onClick={() => setSort(s.key)}
                    className={chip(sort === s.key)}
                  >
                    {s.label}
                  </button>
                ))}
              </ChipRow>

              <ChipRow label="약정">
                <button type="button" onClick={() => setContract(null)} className={chip(contract === null)}>
                  전체
                </button>
                {contracts.map((m) => (
                  <button
                    key={m}
                    type="button"
                    data-testid={`chip-contract-${m}`}
                    onClick={() => setContract(contract === m ? null : m)}
                    className={chip(contract === m)}
                  >
                    {monthsLabel(m)}
                  </button>
                ))}
              </ChipRow>

              {cares.length > 0 && (
                <ChipRow label="관리방법">
                  <button type="button" onClick={() => setCare(null)} className={chip(care === null)}>
                    전체
                  </button>
                  {cares.map((c) => (
                    <button
                      key={c}
                      type="button"
                      data-testid={`chip-care-${c}`}
                      onClick={() => setCare(care === c ? null : c)}
                      className={chip(care === c)}
                    >
                      {c}
                    </button>
                  ))}
                </ChipRow>
              )}

              {categories.length > 0 && (
                <ChipRow label="카테고리">
                  <button type="button" onClick={() => setCategory(null)} className={chip(category === null)}>
                    전체
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => setCategory(category === c.slug ? null : c.slug)}
                      className={chip(category === c.slug)}
                    >
                      {c.name}
                    </button>
                  ))}
                </ChipRow>
              )}

              <ChipRow label="브랜드">
                <button type="button" onClick={() => setBrand(null)} className={chip(brand === null)}>
                  전체
                </button>
                {brands.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBrand(brand === b ? null : b)}
                    className={chip(brand === b)}
                  >
                    {b}
                  </button>
                ))}
              </ChipRow>

              {availableSpecs.map((axis) => (
                <ChipRow key={axis.key} label={axis.label}>
                  <button
                    type="button"
                    onClick={() =>
                      setSpecFilters((prev) => {
                        const next = { ...prev };
                        delete next[axis.key];
                        return next;
                      })
                    }
                    className={chip(!specFilters[axis.key])}
                  >
                    전체
                  </button>
                  {axis.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleSpec(axis.key, opt)}
                      className={chip(specFilters[axis.key] === opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </ChipRow>
              ))}
            </div>

            <div className="sticky bottom-0 bg-white flex gap-3 px-6 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={reset}
                className="h-12 px-5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                초기화
              </button>
              <button
                type="button"
                data-testid="filter-sheet-apply"
                onClick={() => {
                  setVisible(PAGE_SIZE);
                  setSheetOpen(false);
                }}
                className="flex-1 h-12 rounded-xl bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-white font-bold transition-colors"
              >
                {rows.length}개 제품 보기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** 시트 안 필터 한 묶음. 항목이 많아도 줄바꿈 없이 한 줄 가로 스와이프로 유지한다. */
function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-6 text-sm font-bold text-[#333d4b] mb-2.5">{label}</p>
      <div className="flex gap-1.5 overflow-x-auto px-6 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {children}
      </div>
    </div>
  );
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 h-8 pl-3 pr-2 rounded-full bg-[#fff1f5] text-[var(--action-primary)] text-xs font-bold">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${label} 필터 제거`}
        className="p-0.5 rounded-full hover:bg-white/60 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
