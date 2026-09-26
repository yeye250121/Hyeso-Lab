'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Package } from 'lucide-react';
import WishButton from './WishButton';

// 목록·홈·추천이 함께 쓰는 카드. 데이터가 없는 항목(별점 등)은 자리 자체를
// 만들지 않는다 — 허수를 표기하지 않는 것이 원칙이다.
export type CardProduct = {
  slug: string;
  category_slug: string;
  brand: string;
  model_code: string;
  display_name: string;
  image_urls: string[];
  minFee: number;
  listPrice: number | null;
  /** 요약 요금제. 없으면 관리방법 뱃지를 생략한다 */
  plans?: { c: number; t: string | null; f: number }[];
};

export default function ProductCardV2({
  product,
  priority = false,
  fee,
  contractMonths = null,
}: {
  product: CardProduct;
  priority?: boolean;
  /** 목록 필터가 약정/관리 조건으로 재계산한 월 렌탈료. 없으면 전체 최저가 */
  fee?: number;
  /** 약정을 특정했을 때만 값이 있다. 있으면 "~" 를 떼고 총액 캡션을 단다 */
  contractMonths?: number | null;
}) {
  const image = product.image_urls?.[0] ?? null;
  const shownFee = fee ?? product.minFee;
  const discountPct =
    product.listPrice && product.listPrice > shownFee
      ? Math.round((1 - shownFee / product.listPrice) * 100)
      : null;
  const careTypes = [...new Set((product.plans ?? []).map((s) => s.t).filter(Boolean))] as string[];
  const contracts = [...new Set((product.plans ?? []).map((s) => s.c))].sort((a, b) => a - b);

  return (
    <Link
      href={`/electronics/${product.category_slug}/${product.slug}`}
      data-testid="product-card"
      data-slug={product.slug}
      className="group block"
    >
      {/* 상품 사진은 흰 배경 누끼가 대부분이라 흰 바탕에 여백을 두고 통째로 보여준다 */}
      <div className={`relative aspect-[5/6] rounded-2xl overflow-hidden ${image ? 'bg-white border border-gray-100' : 'bg-[#f4f5f7]'}`}>
        {image ? (
          <Image
            src={image}
            alt={product.display_name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-[1.03]"
            priority={priority}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center">
            <Package className="w-9 h-9 text-gray-300" strokeWidth={1.3} />
          </span>
        )}

        {discountPct !== null && discountPct >= 5 && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-[var(--action-primary)] text-white text-[13px] font-bold">
            {discountPct}% 할인
          </span>
        )}

        <WishButton
          item={{
            slug: product.slug,
            category: product.category_slug,
            brand: product.brand,
            name: product.display_name,
            fee: product.minFee,
            list: product.listPrice,
            img: image,
          }}
        />
      </div>

      <div className="mt-2.5 px-0.5">
        <p className="text-[15px] text-[#333d4b] leading-[1.4] line-clamp-2 break-keep">
          <span className="font-bold">{product.brand}</span> {product.display_name}
        </p>
        <p className="mt-0.5 text-xs text-gray-400 truncate">{product.model_code}</p>

        <p className="mt-1.5 flex items-baseline gap-1.5">
          {discountPct !== null && discountPct >= 5 && (
            <span className="text-[17px] font-bold text-[var(--action-primary)]">
              {discountPct}%
            </span>
          )}
          <span className="text-[17px] font-bold text-[#333d4b]">
            월 {shownFee.toLocaleString()}원{contractMonths === null ? '~' : ''}
          </span>
        </p>

        {contractMonths !== null && (
          <p className="mt-0.5 text-[11px] text-gray-400">
            총 {(shownFee * contractMonths).toLocaleString()}원
          </p>
        )}

        {(careTypes.length > 0 || contracts.length > 0) && (
          <p className="mt-1.5 flex flex-wrap items-center gap-1">
            {careTypes.map((t) => (
              <span
                key={t}
                className="px-1.5 py-0.5 rounded-md bg-[#fff1f5] text-[var(--action-primary)] text-[11px] font-bold"
              >
                {t === '방문관리' ? '방문설치' : t}
              </span>
            ))}
            {contracts.length > 0 && (
              <span className="text-[11px] text-gray-400">
                약정 {contracts[0] / 12}~{contracts[contracts.length - 1] / 12}년
              </span>
            )}
          </p>
        )}
      </div>
    </Link>
  );
}
