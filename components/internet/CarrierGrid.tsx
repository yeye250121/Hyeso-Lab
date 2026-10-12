import Link from 'next/link';
import type { Carrier, InternetProduct } from '@/lib/internetApi';
import CarrierLogo from './CarrierLogo';

// 메인의 통신사 선택. 로고 카드 + 그 통신사 최저 월 요금 한 줄.
// 사업자 전용(소호)은 뱃지를 달아 뒤에 둔다.
export default function CarrierGrid({
  carriers,
  products,
}: {
  carriers: Carrier[];
  products: InternetProduct[];
}) {
  const minFee = (id: string) =>
    products.filter((p) => p.carrier_id === id).reduce((m, p) => Math.min(m, p.monthly_fee), Infinity);

  return (
    <ul className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2.5" data-testid="carrier-grid">
      {carriers.map((c) => {
        const fee = minFee(c.id);
        return (
          <li key={c.id}>
            <Link
              href={`/internet/${c.id}`}
              data-testid={`carrier-card-${c.id}`}
              className="group relative flex flex-col items-center gap-2 rounded-2xl bg-[#f4f5f7] px-2 pt-5 pb-4 transition-colors hover:bg-[#eceef1]"
            >
              {c.business_only && (
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-white text-[10px] font-bold text-gray-500">
                  사업자
                </span>
              )}
              <span className="flex items-center justify-center h-9 w-full px-3">
                <CarrierLogo src={c.logo_url} name={c.name} className="max-h-8 max-w-full" />
              </span>
              <span className="text-[13px] font-semibold text-[#333d4b] leading-tight text-center">{c.name}</span>
              {Number.isFinite(fee) && (
                <span className="text-[12px] text-gray-500 tabular-nums">월 {fee.toLocaleString()}원~</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
