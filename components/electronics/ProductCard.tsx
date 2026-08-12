import Image from 'next/image';
import Link from 'next/link';
import { Droplets } from 'lucide-react';
import type { ProductListItem } from '@/lib/electronicsApi';

// 스펙 배지로 노출할 축. 값이 없는 제품은 해당 배지를 생략한다
// (정책표에 제품유형/정수타입이 없는 브랜드가 있다).
const SPEC_KEYS: (keyof ProductListItem['specs'])[] = ['purifyFunction', 'productType', 'waterType'];

export default function ProductCard({
  product,
  categorySlug,
  priority = false,
}: {
  product: ProductListItem;
  categorySlug: string;
  priority?: boolean;
}) {
  const image = product.image_urls?.[0];
  const badges = SPEC_KEYS.map((k) => product.specs[k]).filter(
    (v): v is string => typeof v === 'string' && v.length > 0
  );

  return (
    <Link
      href={`/electronics/${categorySlug}/${product.slug}`}
      className="group flex flex-col rounded-2xl border border-gray-100 bg-white overflow-hidden hover:border-[var(--action-primary)] hover:shadow-md transition-all"
    >
      <div className="relative aspect-[4/3] bg-gradient-to-b from-[#f6f8fb] to-[#eef1f6] flex items-center justify-center">
        {image ? (
          <Image
            src={image}
            alt={product.display_name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            priority={priority}
          />
        ) : (
          <Droplets className="w-10 h-10 text-gray-300" strokeWidth={1.5} />
        )}
      </div>

      <div className="flex flex-col flex-1 p-4">
        <p className="text-xs font-bold text-gray-400">{product.brand}</p>
        <h3 className="mt-1 font-bold text-[#333d4b] leading-snug line-clamp-2">
          {product.display_name}
        </h3>
        <p className="mt-0.5 text-xs text-gray-400 truncate">{product.model_code}</p>

        {badges.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {badges.map((b) => (
              <span
                key={b}
                className="inline-block px-2 py-0.5 rounded-md bg-gray-50 text-gray-500 text-[11px] font-medium"
              >
                {b}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4">
          {product.listPrice && (
            <p className="text-xs text-gray-400 line-through">
              월 {product.listPrice.toLocaleString()}원
            </p>
          )}
          <p className="text-[#333d4b]">
            <span className="text-sm text-gray-500">월 </span>
            <span className="text-xl font-bold">{product.minFee.toLocaleString()}</span>
            <span className="text-sm font-bold">원~</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
