import Image from 'next/image';
import { Info } from 'lucide-react';
import type { ProductDetail, ProductInsights } from '@/lib/electronicsApi';

// 상세정보. 조합을 전부 나열하면 눈만 아프므로 약정별 최저가만 한 줄씩 보여준다.
// "월이 싸질수록 총액은 비싸진다"가 한눈에 들어오는 것이 목적이다.
//
// 제휴사에서 제품 상세 이미지를 받으면 image_urls 에 넣기만 하면 표 위에 붙는다.

function monthsLabel(m: number) {
  return m % 12 === 0 ? `${m / 12}년` : `${m}개월`;
}

export default function PlanBreakdown({
  product,
  insights,
}: {
  product: ProductDetail;
  insights: ProductInsights | undefined;
}) {
  const byContract = new Map<number, number>();
  for (const p of product.plans) {
    const prev = byContract.get(p.contract_months);
    if (prev === undefined || p.monthly_fee < prev) byContract.set(p.contract_months, p.monthly_fee);
  }
  const rows = [...byContract.entries()]
    .map(([months, fee]) => ({ months, fee, total: fee * months }))
    .sort((a, b) => a.months - b.months);

  const cheapestMonthly = Math.min(...rows.map((r) => r.fee));
  const cheapestTotal = Math.min(...rows.map((r) => r.total));

  // 상세 이미지는 첫 장(대표 이미지)을 뺀 나머지로 본다
  const detailImages = product.image_urls.slice(1);

  return (
    <div className="space-y-8">
      {detailImages.length > 0 && (
        <div className="space-y-3">
          {detailImages.map((src) => (
            <div key={src} className="relative w-full">
              <Image
                src={src}
                alt={`${product.display_name} 상세 이미지`}
                width={1000}
                height={1400}
                sizes="(max-width: 1024px) 100vw, 900px"
                className="w-full h-auto rounded-2xl"
              />
            </div>
          ))}
        </div>
      )}

      <div>
        <h3 className="text-base font-bold text-[#333d4b] mb-1">약정별 렌탈료</h3>
        <p className="text-sm text-gray-500 mb-4">
          약정이 길수록 월 렌탈료는 내려가지만 총 납부액은 올라갑니다.
        </p>

        <div className="rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8f9fb] text-gray-500">
                <th className="text-left font-medium px-5 py-3">약정</th>
                <th className="text-right font-medium px-5 py-3">월 렌탈료</th>
                <th className="text-right font-medium px-5 py-3">총 납부액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.months}>
                  <td className="px-5 py-3.5 font-medium text-[#333d4b]">
                    {monthsLabel(r.months)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="font-bold text-[#333d4b]">{r.fee.toLocaleString()}원</span>
                    {r.fee === cheapestMonthly && (
                      <span className="ml-1.5 text-[11px] font-bold text-[var(--action-primary)]">
                        월 최저
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={r.total === cheapestTotal ? 'font-bold text-[#333d4b]' : 'text-gray-500'}>
                      {r.total.toLocaleString()}원
                    </span>
                    {r.total === cheapestTotal && (
                      <span className="ml-1.5 text-[11px] font-bold text-[var(--action-primary)]">
                        총액 최저
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {insights?.selfCareSaving != null && (
          <p className="mt-3 flex items-start gap-2 text-sm text-gray-600">
            <Info className="w-4 h-4 text-[var(--action-primary)] shrink-0 mt-0.5" />
            방문관리 대신 자가관리를 고르면 월 약 {insights.selfCareSaving.toLocaleString()}원
            내려갑니다.
          </p>
        )}

        <p className="mt-3 text-xs text-gray-400 leading-relaxed">
          표의 금액은 각 약정에서 가장 저렴한 조건 기준이며, 설치비·등록비는 포함되지 않습니다.
          정확한 조건은 상담 시 확정됩니다.
        </p>
      </div>
    </div>
  );
}
