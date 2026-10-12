import Link from 'next/link';
import type { Carrier } from '@/lib/internetApi';
import CarrierLogo from './CarrierLogo';

// 메인의 통신사 선택. 로고 카드 + 이름만. 사업자 전용(소호)은 싣지 않는다 —
// 사업자 여부는 신청서에서 체크하고 상담에서 푼다.
export default function CarrierGrid({ carriers }: { carriers: Carrier[] }) {
  return (
    <ul className="grid grid-cols-3 sm:grid-cols-6 gap-2.5" data-testid="carrier-grid">
      {carriers
        .filter((c) => !c.business_only)
        .map((c) => (
          <li key={c.id}>
            <Link
              href={`/internet/${c.id}`}
              data-testid={`carrier-card-${c.id}`}
              className="group flex flex-col items-center gap-2 rounded-2xl bg-[#f4f5f7] px-2 pt-5 pb-4 transition-colors hover:bg-[#eceef1]"
            >
              <span className="flex items-center justify-center h-9 w-full px-3">
                <CarrierLogo src={c.logo_url} name={c.name} className="max-h-8 max-w-full" />
              </span>
              <span className="text-[10px] font-medium text-gray-500 leading-tight text-center">{c.name}</span>
            </Link>
          </li>
        ))}
    </ul>
  );
}
