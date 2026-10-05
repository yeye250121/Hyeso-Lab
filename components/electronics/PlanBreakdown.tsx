import Image from 'next/image';
import { ChevronDown, Info } from 'lucide-react';
import type { ProductDetail, ProductInsights } from '@/lib/electronicsApi';

// 상세정보. 조합을 전부 나열하면 눈만 아프므로 약정별 최저가만 한 줄씩 보여준다.
// "월이 싸질수록 총액은 비싸진다"가 한눈에 들어오는 것이 목적이다.
//
// 제휴사에서 제품 상세 이미지를 받으면 image_urls 에 넣기만 하면 표 위에 붙는다.

function monthsLabel(m: number) {
  return m % 12 === 0 ? `${m / 12}년` : `${m}개월`;
}

// 접힌 상태에서 보여줄 제품 정보 줄 수. 나머지는 아코디언을 펴야 나온다.
const VISIBLE_SPEC_ROWS = 4;

export default function PlanBreakdown({
  product,
  insights,
  specRows = [],
}: {
  product: ProductDetail;
  insights: ProductInsights | undefined;
  specRows?: string[][];
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

        {/* 좁은 화면에서 글자가 줄바꿈되지 않도록 셀은 nowrap 으로 두고,
            그래도 넘치면 표가 통째로 가로 스크롤된다. */}
        <div className="rounded-2xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[340px]">
            <thead>
              <tr className="bg-[#f8f9fb] text-gray-500">
                <th className="text-left font-medium px-3 sm:px-5 py-3 whitespace-nowrap">약정</th>
                <th className="text-right font-medium px-3 sm:px-5 py-3 whitespace-nowrap">
                  월 렌탈료
                </th>
                <th className="text-right font-medium px-3 sm:px-5 py-3 whitespace-nowrap">
                  총 납부액
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.months}>
                  <td className="px-3 sm:px-5 py-3.5 font-medium text-[#333d4b] whitespace-nowrap">
                    {monthsLabel(r.months)}
                  </td>
                  <td className="px-3 sm:px-5 py-3.5 text-right whitespace-nowrap">
                    {r.fee === cheapestMonthly && (
                      <span className="mr-1.5 text-[11px] font-bold text-[var(--action-primary)]">
                        월 최저
                      </span>
                    )}
                    <span className="font-bold text-[#333d4b]">{r.fee.toLocaleString()}원</span>
                  </td>
                  <td className="px-3 sm:px-5 py-3.5 text-right whitespace-nowrap">
                    {r.total === cheapestTotal && (
                      <span className="mr-1.5 text-[11px] font-bold text-[var(--action-primary)]">
                        총액 최저
                      </span>
                    )}
                    <span className={r.total === cheapestTotal ? 'font-bold text-[#333d4b]' : 'text-gray-500'}>
                      {r.total.toLocaleString()}원
                    </span>
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

      {specRows.length > 0 && <SpecTable rows={specRows} product={product} />}
    </div>
  );
}

/**
 * 제품 정보. 항상 앞 몇 줄만 보여주고 나머지는 아코디언으로 접는다.
 * details/summary 라 자바스크립트 없이 동작한다.
 */
function SpecTable({ rows, product }: { rows: string[][]; product: ProductDetail }) {
  const base: string[][] = [
    ['브랜드', product.brand],
    ...(product.model_code ? [['모델명', product.model_code]] : []),
    ...rows,
  ];
  const head = base.slice(0, VISIBLE_SPEC_ROWS);
  const rest = base.slice(VISIBLE_SPEC_ROWS);

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex px-5 py-3.5 text-sm border-t border-gray-100 first:border-t-0">
      <dt className="w-24 sm:w-28 text-gray-500 shrink-0">{label}</dt>
      <dd className="font-medium text-[#333d4b] break-all">{value}</dd>
    </div>
  );

  return (
    <div>
      <h3 className="text-base font-bold text-[#333d4b] mb-4">제품 정보</h3>
      <div className="rounded-2xl border border-gray-100 overflow-hidden">
        <dl>
          {head.map(([label, value]) => (
            <Row key={label} label={label} value={value} />
          ))}
        </dl>

        {rest.length > 0 && (
          <details className="group">
            <summary className="flex items-center justify-center gap-1 px-5 py-3 border-t border-gray-100 cursor-pointer list-none text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors [&::-webkit-details-marker]:hidden">
              <span className="group-open:hidden">제품 정보 {rest.length}개 더보기</span>
              <span className="hidden group-open:inline">접기</span>
              <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
            </summary>
            <dl className="border-t border-gray-100">
              {rest.map(([label, value]) => (
                <Row key={label} label={label} value={value} />
              ))}
            </dl>
          </details>
        )}
      </div>
    </div>
  );
}
