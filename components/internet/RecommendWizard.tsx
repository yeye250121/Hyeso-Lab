'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { addonLabel, giftLabel, type Carrier, type InternetProduct } from '@/lib/internetApi';
import CarrierLogo from './CarrierLogo';

// 맞춤 추천 위자드. 신청서(ApplyForm)와 같은 생김새: 진행 점, 큰 제목, 선택지 버튼.
// 선택지를 누르면 바로 다음 질문으로 넘어가고(다음 버튼 없음), 마지막 답을 고르면 결과가 뜬다.

type Household = '1-2' | '3-4' | 'heavy';
type TvAnswer = 'no' | 'yes' | 'unsure';
type CarrierPref = 'any' | string;

const HOUSEHOLD: { key: Household; label: string; sub: string; speeds: string[] }[] = [
  { key: '1-2', label: '1~2명', sub: '웹서핑, 영상 시청 위주', speeds: ['100M', '160M', '200M'] },
  { key: '3-4', label: '3~4명', sub: '게임, 여러 기기 동시 사용', speeds: ['500M'] },
  { key: 'heavy', label: '5명 이상 · 재택근무', sub: '고화질 스트리밍, 대용량 작업', speeds: ['1G'] },
];

const TV: { key: TvAnswer; label: string; sub: string }[] = [
  { key: 'no', label: '안 봐요', sub: '인터넷만 쓸게요' },
  { key: 'yes', label: '봐요', sub: '인터넷 + TV로 할게요' },
  { key: 'unsure', label: '잘 모르겠어요', sub: '둘 다 보여주세요' },
];

const STEPS = ['인원', 'TV', '통신사'];

export default function RecommendWizard({
  carriers,
  products,
}: {
  carriers: Carrier[];
  products: InternetProduct[];
}) {
  const [step, setStep] = useState(0);
  const [household, setHousehold] = useState<Household | null>(null);
  const [tv, setTv] = useState<TvAnswer | null>(null);
  const [pref, setPref] = useState<CarrierPref | null>(null);
  const done = step === STEPS.length;

  const results = useMemo(() => {
    if (!household || !tv) return [];
    const speeds = HOUSEHOLD.find((h) => h.key === household)!.speeds;
    const rows = carriers.flatMap((c) => {
      const pool = products.filter(
        (p) =>
          p.carrier_id === c.id &&
          speeds.includes(p.speed) &&
          (tv === 'unsure' ? p.addon_type === 'none' || p.addon_type === 'tv' : p.addon_type === (tv === 'yes' ? 'tv' : 'none'))
      );
      if (pool.length === 0) return [];
      const best = pool.reduce((m, p) => (p.monthly_fee < m.monthly_fee ? p : m));
      return [{ carrier: c, product: best }];
    });
    rows.sort((a, b) => a.product.monthly_fee - b.product.monthly_fee);
    // 선호 통신사가 있으면 그 통신사를 맨 위로
    if (pref && pref !== 'any') {
      const i = rows.findIndex((r) => r.carrier.id === pref);
      if (i > 0) rows.unshift(...rows.splice(i, 1));
    }
    return rows;
  }, [household, tv, pref, carriers, products]);

  const go = (next: number) => {
    setStep(next);
    requestAnimationFrame(() => window.scrollTo({ top: 0 }));
  };
  const reset = () => {
    setHousehold(null);
    setTv(null);
    setPref(null);
    go(0);
  };

  const href = (carrierId: string, p: InternetProduct) =>
    `/internet/${carrierId}?addon=${p.addon_type}&speed=${p.speed}${p.addon_name ? `&name=${encodeURIComponent(p.addon_name)}` : ''}`;

  /* ── 결과 ── */
  if (done) {
    const top = results[0];
    return (
      <div className="max-w-[560px] mx-auto px-6 pt-8 pb-36" data-testid="rec-result-screen">
        <button type="button" onClick={() => go(STEPS.length - 1)} className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#333d4b] mb-4">
          <ChevronLeft className="w-4 h-4" /> 이전
        </button>
        {top ? (
          <>
            <h1 className="text-[26px] font-semibold text-[#333d4b] leading-snug">
              이 조건이 가장 잘 맞아요
            </h1>
            <p className="mt-2 text-[14px] text-gray-500">
              {HOUSEHOLD.find((h) => h.key === household)?.label} · TV {tv === 'yes' ? '봐요' : tv === 'no' ? '안 봐요' : '미정'}
              {pref && pref !== 'any' ? ` · ${carriers.find((c) => c.id === pref)?.name}` : ''}
            </p>

            <Link
              href={href(top.carrier.id, top.product)}
              data-testid="rec-top"
              className="mt-6 block rounded-2xl bg-[#fff1f5] ring-2 ring-[#ff9ebb] px-5 py-5"
            >
              <span className="flex items-center gap-3">
                <span className="flex items-center justify-center w-16 h-10 rounded-xl bg-white shrink-0">
                  <CarrierLogo src={top.carrier.logo_url} name={top.carrier.name} className="max-h-6 max-w-[52px]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[16px] font-bold text-[#333d4b]">{top.carrier.name}</span>
                  <span className="block text-[13px] text-gray-500 truncate">
                    {top.product.speed} {top.product.internet_name} · {addonLabel(top.product)}
                  </span>
                </span>
              </span>
              <span className="mt-4 flex items-end justify-between">
                <span className="text-[13px] text-gray-500">
                  사은품 <strong className="font-semibold text-[var(--action-primary)]">{giftLabel(top.product)}</strong>
                </span>
                <span className="text-[24px] font-bold text-[#191f28] tabular-nums leading-none">
                  월 {top.product.monthly_fee.toLocaleString()}원
                </span>
              </span>
            </Link>

            {results.length > 1 && (
              <>
                <h2 className="mt-10 text-[17px] font-bold text-[#333d4b]">다른 통신사는 이래요</h2>
                <ul className="mt-3 space-y-2" data-testid="rec-others">
                  {results.slice(1).map(({ carrier, product }) => (
                    <li key={product.id}>
                      <Link
                        href={href(carrier.id, product)}
                        data-testid="rec-result"
                        className="flex items-center gap-3.5 rounded-2xl bg-[#f4f5f7] px-4 py-3.5 transition-colors hover:bg-[#eceef1]"
                      >
                        <span className="flex items-center justify-center w-14 h-9 rounded-lg bg-white shrink-0">
                          <CarrierLogo src={carrier.logo_url} name={carrier.name} className="max-h-5 max-w-[48px]" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[15px] font-semibold text-[#333d4b]">{carrier.name}</span>
                          <span className="block text-[12px] text-gray-500 truncate">
                            {product.speed} · {addonLabel(product)} · 사은품 {giftLabel(product)}
                          </span>
                        </span>
                        <span className="text-[15px] font-bold text-[#333d4b] tabular-nums shrink-0">
                          월 {product.monthly_fee.toLocaleString()}원
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        ) : (
          <>
            <h1 className="text-[26px] font-semibold text-[#333d4b] leading-snug">딱 맞는 상품이 아직 없어요</h1>
            <p className="mt-2 text-[14px] text-gray-500">상담으로 알아봐 드릴게요.</p>
          </>
        )}

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 pt-4 pb-4">
          <div className="max-w-[560px] mx-auto space-y-2">
            {top ? (
              <Link
                href={`/internet/application?product=${top.product.id}`}
                data-testid="rec-apply"
                className="flex items-center justify-center w-full py-4 rounded-xl bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-white font-semibold transition-colors"
              >
                이 조건으로 신청하기
              </Link>
            ) : (
              <Link
                href="/apply?service=internet"
                className="flex items-center justify-center w-full py-4 rounded-xl bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-white font-semibold transition-colors"
              >
                상담 신청하기
              </Link>
            )}
            <button
              type="button"
              onClick={reset}
              className="flex items-center justify-center gap-1 w-full py-3 text-sm font-medium text-gray-500 hover:text-[#333d4b]"
            >
              <RotateCcw className="w-3.5 h-3.5" /> 처음부터 다시 고르기
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── 질문 ── */
  return (
    <div className="max-w-[560px] mx-auto px-6 pb-16" data-testid="rec-wizard">
      <div className="flex items-center gap-2 pt-8 pb-6">
        {STEPS.map((label, i) => (
          <span
            key={label}
            className={`flex items-center justify-center rounded-full text-xs font-semibold transition-all ${
              i === step
                ? 'w-6 h-6 bg-[var(--action-primary)] text-white'
                : i < step
                  ? 'w-2.5 h-2.5 bg-[var(--action-primary)]'
                  : 'w-2.5 h-2.5 bg-gray-200'
            }`}
          >
            {i === step ? i + 1 : ''}
          </span>
        ))}
      </div>

      {step > 0 ? (
        <button type="button" onClick={() => go(step - 1)} className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#333d4b] mb-4">
          <ChevronLeft className="w-4 h-4" /> 이전
        </button>
      ) : (
        <Link href="/internet" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#333d4b] mb-4">
          <ChevronLeft className="w-4 h-4" /> 인터넷 홈
        </Link>
      )}

      {step === 0 && (
        <>
          <h1 className="text-[26px] font-semibold text-[#333d4b] leading-snug mb-8">
            집에서 몇 명이<br />인터넷을 쓰세요?
          </h1>
          <div className="space-y-2.5">
            {HOUSEHOLD.map((h) => (
              <Option key={h.key} active={household === h.key} label={h.label} sub={h.sub} testId={`rec-household-${h.key}`} onClick={() => { setHousehold(h.key); go(1); }} />
            ))}
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <h1 className="text-[26px] font-semibold text-[#333d4b] leading-snug mb-8">TV도 함께 보세요?</h1>
          <div className="space-y-2.5">
            {TV.map((t) => (
              <Option key={t.key} active={tv === t.key} label={t.label} sub={t.sub} testId={`rec-tv-${t.key}`} onClick={() => { setTv(t.key); go(2); }} />
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h1 className="text-[26px] font-semibold text-[#333d4b] leading-snug mb-8">
            원하는 통신사가<br />있으세요?
          </h1>
          <div className="space-y-2.5">
            <Option active={pref === 'any'} label="상관없어요" sub="가장 저렴한 곳부터 보여주세요" testId="rec-pref-any" onClick={() => { setPref('any'); go(3); }} />
            <ul className="grid grid-cols-3 gap-2 pt-2">
              {carriers.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    data-testid={`rec-pref-${c.id}`}
                    onClick={() => { setPref(c.id); go(3); }}
                    className={`w-full flex flex-col items-center gap-1.5 rounded-xl px-2 pt-4 pb-3 transition-colors ${
                      pref === c.id ? 'bg-[#fff1f5] ring-2 ring-[#ff9ebb]' : 'bg-[#f2f4f6] hover:bg-[#eceef1]'
                    }`}
                  >
                    <span className="flex items-center justify-center h-7">
                      <CarrierLogo src={c.logo_url} name={c.name} className="max-h-6 max-w-[64px]" />
                    </span>
                    <span className="text-[10px] font-medium text-gray-500">{c.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function Option({ active, label, sub, onClick, testId }: { active: boolean; label: string; sub: string; onClick: () => void; testId: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      aria-pressed={active}
      className={`w-full flex items-center justify-between rounded-xl px-5 py-4 text-left transition-colors ${
        active ? 'bg-[#fff1f5] ring-2 ring-[#ff9ebb]' : 'bg-[#f2f4f6] hover:bg-[#eceef1]'
      }`}
    >
      <span>
        <span className={`block text-[15px] font-semibold ${active ? 'text-[var(--action-primary)]' : 'text-[#333d4b]'}`}>{label}</span>
        <span className="block text-[13px] text-gray-500 mt-0.5">{sub}</span>
      </span>
      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
    </button>
  );
}
