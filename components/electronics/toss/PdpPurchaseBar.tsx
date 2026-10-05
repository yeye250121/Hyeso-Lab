'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { ProductPlan } from '@/lib/electronicsApi';
import PlanSelector from '@/components/electronics/PlanSelector';
import WishButton from './WishButton';
import type { WishItem } from './useWishlist';

// 모바일 PDP 하단 고정 바. "신청하기"를 누르면 옵션 바텀시트가 올라오고,
// 시트 안은 기존 PlanSelector 그대로다 — 조건 선택과 신청 라우팅(백엔드 연결)을
// 재사용하기 위해서다. 데스크톱은 우측 컬럼의 인라인 선택기를 쓴다.
export default function PdpPurchaseBar({
  plans,
  productSlug,
  brand,
  minFee,
  wishItem,
}: {
  plans: ProductPlan[];
  productSlug: string;
  brand: string;
  minFee: number;
  wishItem: Omit<WishItem, 'addedAt'>;
}) {
  const [open, setOpen] = useState(false);

  // 시트가 열려 있는 동안 배경 스크롤을 잠근다
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      {/* 하단 고정 바 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        <div className="flex items-center gap-2.5">
          <WishButton item={wishItem} variant="bar" />
          <button
            type="button"
            data-testid="pdp-sticky-buy"
            onClick={() => setOpen(true)}
            className="flex-1 h-12 rounded-xl bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-white font-bold text-[15px] transition-colors"
          >
            월 {minFee.toLocaleString()}원~ 신청하기
          </button>
        </div>
      </div>

      {/* 옵션 바텀시트 */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <button
            type="button"
            aria-label="닫기"
            data-testid="option-sheet-dim"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div
            data-testid="option-sheet"
            className="relative w-full max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white px-5 pt-5 pb-[max(env(safe-area-inset-bottom),20px)] animate-[sheetUp_.25s_ease-out]"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#333d4b]">가입 조건 선택</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="닫기"
                className="p-1.5 rounded-full hover:bg-gray-50 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <PlanSelector plans={plans} productSlug={productSlug} brand={brand} />
          </div>
        </div>
      )}
    </>
  );
}
