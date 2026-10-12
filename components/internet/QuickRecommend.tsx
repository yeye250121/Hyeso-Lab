'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { addonLabel, giftLabel, type Carrier, type InternetProduct } from '@/lib/internetApi';
import CarrierLogo from './CarrierLogo';

// 메인의 "딱 맞는 요금제 추천". 별도 페이지·진행률·다음 버튼 없이
// 질문 2개를 칩으로 고르면 바로 아래에 통신사별 최저 조합이 뜬다.
// 답을 바꾸면 결과만 갈아끼운다. 결과 카드는 통신사 설정기로 조건을 넘긴다.

type Household = '1-2' | '3-4' | 'heavy';
type TvAnswer = 'no' | 'yes' | 'unsure';

const HOUSEHOLD: { key: Household; label: string; sub: string; speeds: string[] }[] = [
  { key: '1-2', label: '1~2인', sub: '웹서핑 · 영상 시청', speeds: ['100M', '160M', '200M'] },
  { key: '3-4', label: '3~4인', sub: '게임 · 여러 기기', speeds: ['500M'] },
  { key: 'heavy', label: '재택 · 헤비', sub: '고화질 스트리밍 · 재택근무', speeds: ['1G'] },
];

const TV: { key: TvAnswer; label: string }[] = [
  { key: 'no', label: '안 봐요' },
  { key: 'yes', label: '봐요' },
  { key: 'unsure', label: '잘 모르겠어요' },
];

export default function QuickRecommend({
  carriers,
  products,
}: {
  carriers: Carrier[];
  products: InternetProduct[];
}) {
  const [household, setHousehold] = useState<Household | null>(null);
  const [tv, setTv] = useState<TvAnswer | null>(null);

  const results = useMemo(() => {
    if (!household || !tv) return null;
    const speeds = HOUSEHOLD.find((h) => h.key === household)!.speeds;
    const consumerCarriers = carriers.filter((c) => !c.business_only);
    const rows = consumerCarriers.flatMap((c) => {
      const pool = products.filter(
        (p) =>
          p.carrier_id === c.id &&
          speeds.includes(p.speed) &&
          (tv === 'unsure' ? p.addon_type !== 'phone' && p.addon_type !== 'cctv' : p.addon_type === (tv === 'yes' ? 'tv' : 'none'))
      );
      if (pool.length === 0) return [];
      const best = pool.reduce((m, p) => (p.monthly_fee < m.monthly_fee ? p : m));
      return [{ carrier: c, product: best }];
    });
    return rows.sort((a, b) => a.product.monthly_fee - b.product.monthly_fee);
  }, [household, tv, carriers, products]);

  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
      active ? 'bg-[#333d4b] text-white' : 'bg-[#f2f4f6] text-[#4e5968] hover:bg-[#eceef1]'
    }`;

  return (
    <div data-testid="quick-recommend">
      <div className="rounded-2xl bg-[#f4f5f7] p-5 space-y-5">
        <div>
          <p className="text-[15px] font-semibold text-[#333d4b]">집에서 몇 명이 쓰세요?</p>
          <div className="mt-3 flex gap-2 overflow-x-auto -mx-5 px-5 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {HOUSEHOLD.map((h) => (
              <button
                key={h.key}
                type="button"
                data-testid={`rec-household-${h.key}`}
                onClick={() => setHousehold(h.key)}
                className={chip(household === h.key)}
                aria-pressed={household === h.key}
              >
                {h.label}
                <span className={`ml-1.5 text-xs ${household === h.key ? 'text-white/70' : 'text-gray-400'}`}>{h.sub}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[15px] font-semibold text-[#333d4b]">TV도 함께 보세요?</p>
          <div className="mt-3 flex gap-2">
            {TV.map((t) => (
              <button
                key={t.key}
                type="button"
                data-testid={`rec-tv-${t.key}`}
                onClick={() => setTv(t.key)}
                className={chip(tv === t.key)}
                aria-pressed={tv === t.key}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {results === null ? (
        <p className="mt-4 text-sm text-gray-400 text-center">두 가지만 고르면 통신사별 요금을 바로 비교해 드려요.</p>
      ) : results.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400 text-center">조건에 맞는 상품이 아직 없어요. 상담으로 알아봐 드릴게요.</p>
      ) : (
        <ul className="mt-4 space-y-2" data-testid="rec-results">
          {results.map(({ carrier, product }, i) => (
            <li key={product.id}>
              <Link
                href={`/internet/${carrier.id}?addon=${product.addon_type}&speed=${product.speed}${product.addon_name ? `&name=${encodeURIComponent(product.addon_name)}` : ''}`}
                data-testid="rec-result"
                className="flex items-center gap-3.5 rounded-2xl border border-gray-100 px-4 py-3.5 transition-colors hover:bg-[#f9fafb]"
              >
                <span className="flex items-center justify-center w-14 h-10 shrink-0">
                  <CarrierLogo src={carrier.logo_url} name={carrier.name} className="max-h-7 max-w-full" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[15px] font-semibold text-[#333d4b]">{carrier.name}</span>
                    {i === 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-[#fff1f5] text-[11px] font-bold text-[var(--action-primary)]">
                        가장 저렴
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-gray-500 truncate">
                    {product.speed} · {addonLabel(product)} · 사은품 {giftLabel(product)}
                  </span>
                </span>
                <span className="text-right shrink-0">
                  <span className="block text-[15px] font-bold text-[#333d4b] tabular-nums">
                    월 {product.monthly_fee.toLocaleString()}원
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
