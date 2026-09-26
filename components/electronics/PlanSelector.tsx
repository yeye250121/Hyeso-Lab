'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Info } from 'lucide-react';
import type { ProductPlan } from '@/lib/electronicsApi';

// 약정 -> 관리방법 -> 판매구분 순으로 좁혀가며 요금제를 고른다.
// 앞 단계를 바꾸면 뒤 단계는 선택 가능한 값으로 자동 보정된다.

// 칩에는 짧게("3년"), 가격 요약에는 길게("3년 약정") 쓴다
function monthsShort(m: number) {
  return m % 12 === 0 ? `${m / 12}년` : `${m}개월`;
}
function monthsLabel(m: number) {
  return `${monthsShort(m)} 약정`;
}

export default function PlanSelector({
  plans,
  productSlug,
}: {
  plans: ProductPlan[];
  productSlug: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const contracts = useMemo(
    () => [...new Set(plans.map((p) => p.contract_months))].sort((a, b) => a - b),
    [plans]
  );
  const [contract, setContract] = useState(contracts[0]);

  const caresFor = (c: number) => [
    ...new Set(plans.filter((p) => p.contract_months === c).map((p) => p.care_type)),
  ];
  const cares = caresFor(contract);
  const [care, setCare] = useState<string | null>(cares[0] ?? null);

  const variantsFor = (c: number, ct: string | null) => [
    ...new Set(
      plans.filter((p) => p.contract_months === c && p.care_type === ct).map((p) => p.plan_variant)
    ),
  ];
  const variants = variantsFor(contract, care);
  const [variant, setVariant] = useState(variants[0]);

  // 상위 선택이 바뀌었을 때 하위 선택을 유효한 값으로 보정한다
  const effectiveCare = cares.includes(care) ? care : cares[0] ?? null;
  const effectiveVariants = variantsFor(contract, effectiveCare);
  const effectiveVariant = effectiveVariants.includes(variant) ? variant : effectiveVariants[0];

  const candidates = plans.filter(
    (p) =>
      p.contract_months === contract &&
      p.care_type === effectiveCare &&
      p.plan_variant === effectiveVariant
  );
  // 같은 조합에 요금제가 여럿이면(관리주기 차이 등) 가장 저렴한 것을 기본으로 보여준다
  const selected = candidates.sort((a, b) => a.monthly_fee - b.monthly_fee)[0];

  if (!selected) return null;

  const total = selected.monthly_fee * contract;
  const discount =
    selected.list_price && selected.list_price > selected.monthly_fee
      ? selected.list_price - selected.monthly_fee
      : 0;

  const chip = (active: boolean) =>
    `px-3.5 py-1.5 rounded-full text-[13px] font-bold transition-all border whitespace-nowrap ${
      active
        ? 'border-[var(--action-primary)] bg-[#fff1f5] text-[var(--action-primary)]'
        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
    }`;

  const apply = () => {
    setSubmitting(true);
    // planId 만 넘기면 신청 폼이 약정/관리를 기본값(최저 약정)으로 되돌린다.
    // 화면에 보이는 선택과 저장되는 조건이 어긋나지 않도록 함께 넘긴다.
    const params = new URLSearchParams({
      product: productSlug,
      plan: selected.id,
      months: String(contract),
    });
    if (effectiveCare) params.set('care', effectiveCare);
    router.push(`/apply?${params.toString()}`);
  };

  return (
    <div className="w-full">
      <div className="space-y-3">
        <div>
          <p className="text-[13px] font-bold text-[#333d4b] mb-1.5">약정</p>
          <div className="flex flex-wrap gap-1.5">
            {contracts.map((c) => (
              <button
                key={c}
                type="button"
                data-testid={`plan-contract-${c}`}
                onClick={() => setContract(c)}
                className={chip(contract === c)}
              >
                {monthsShort(c)}
              </button>
            ))}
          </div>
        </div>

        {cares.length > 0 && (
          <div>
            <p className="text-[13px] font-bold text-[#333d4b] mb-1.5">관리방법</p>
            <div className="flex flex-wrap gap-1.5">
              {cares.map((c) => (
                <button
                  key={c ?? 'none'}
                  type="button"
                  data-testid={`plan-care-${c ?? 'none'}`}
                  onClick={() => setCare(c)}
                  className={chip(effectiveCare === c)}
                >
                  {c ?? '관리 정보 없음'}
                </button>
              ))}
            </div>
          </div>
        )}

        {effectiveVariants.length > 1 && (
          <div>
            <p className="text-[13px] font-bold text-[#333d4b] mb-1.5">판매조건</p>
            <div className="flex flex-wrap gap-1.5">
              {effectiveVariants.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVariant(v)}
                  className={chip(effectiveVariant === v)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        {selected.care_cycle_months && (
          <p className="text-xs text-gray-400">
            {/* 자가관리는 방문이 아니라 필터/소모품을 스스로 교체하는 주기다 */}
            {effectiveCare === '자가관리'
              ? `관리 주기 ${selected.care_cycle_months}개월 (자가 교체)`
              : `${selected.care_cycle_months}개월마다 방문 관리`}
          </p>
        )}
      </div>

      {/* 가격 요약 */}
      <div className="mt-8 rounded-2xl bg-[#f8f9fb] p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-gray-500">월 렌탈료</p>
            {discount > 0 && (
              <p className="text-sm text-gray-400 line-through mt-1">
                {selected.list_price!.toLocaleString()}원
              </p>
            )}
          </div>
          <p className="text-[#333d4b] text-right">
            <span className="text-[28px] font-bold leading-none">
              {selected.monthly_fee.toLocaleString()}
            </span>
            <span className="text-lg font-bold">원</span>
          </p>
        </div>

        {discount > 0 && (
          <p className="mt-2 text-right text-sm font-bold text-[var(--action-primary)]">
            월 {discount.toLocaleString()}원 할인
          </p>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">약정</span>
            <span className="font-medium text-[#333d4b]">{monthsLabel(contract)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">총 납부액</span>
            <span className="font-bold text-[#333d4b]">{total.toLocaleString()}원</span>
          </div>
          {selected.ownership_months && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">소유권 이전</span>
              <span className="font-medium text-[#333d4b]">{selected.ownership_months}개월</span>
            </div>
          )}
        </div>

        {selected.promotion_note && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-white px-3 py-2.5 text-xs text-gray-600 leading-relaxed">
            <Info className="w-3.5 h-3.5 text-[var(--action-primary)] shrink-0 mt-0.5" />
            {selected.promotion_note}
          </p>
        )}

        <p className="mt-3 text-[11px] text-gray-400 leading-relaxed">
          총 납부액은 월 렌탈료 × 약정 기간으로 계산한 금액이며, 설치비·등록비는 포함되지 않습니다.
          실제 조건은 상담 시 확정됩니다.
        </p>
      </div>

      <button
        type="button"
        data-testid="plan-apply"
        onClick={apply}
        disabled={submitting}
        className="mt-5 w-full py-4 rounded-xl bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] disabled:opacity-60 text-white font-bold text-[15px] transition-colors flex items-center justify-center gap-2"
      >
        <Check className="w-4 h-4" />
        {submitting ? '이동 중…' : '이 조건으로 신청하기'}
      </button>
    </div>
  );
}
