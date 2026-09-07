import type { ProductDetail, ProductInsights } from '@/lib/electronicsApi';

// 스펙분석 = "요점정리". 숫자를 읽게 하지 않고 위치를 보여주는 것이 목표다.
//  1) 한 줄 헤드라인 — 순위는 문장으로만
//  2) 가격 위치 막대 — 읽을 숫자는 양 끝과 현재값 셋뿐
//  3) 핵심 스펙 4칸

// 요약 칸에 우선해서 넣을 스펙. 카테고리마다 중요한 축이 달라 순서를 따로 둔다.
// 값이 있는 것만 앞에서부터 3개를 쓴다.
const SPEC_SLOTS: Record<string, { key: keyof ProductDetail['specs']; label: string }[]> = {
  'water-purifier': [
    { key: 'purifyFunction', label: '정수 기능' },
    { key: 'productType', label: '제품 유형' },
    { key: 'waterType', label: '정수 타입' },
    { key: 'filterType', label: '필터' },
    { key: 'sterilization', label: '살균' },
  ],
  'air-purifier': [
    { key: 'coverageArea', label: '사용 면적' },
    { key: 'energyGrade', label: '에너지효율' },
    { key: 'sensor', label: '센서' },
    { key: 'sizeWDH', label: '크기' },
  ],
  bidet: [
    { key: 'productType', label: '형태' },
    { key: 'nozzleMaterial', label: '노즐 소재' },
    { key: 'drying', label: '건조' },
    { key: 'sterilization', label: '살균' },
  ],
  mattress: [
    { key: 'bedSize', label: '사이즈' },
    { key: 'springType', label: '스프링' },
    { key: 'firmness', label: '쿠션감' },
    { key: 'zones', label: '존' },
  ],
};

const FALLBACK_SLOTS: { key: keyof ProductDetail['specs']; label: string }[] = [
  { key: 'productType', label: '제품 유형' },
  { key: 'sizeWDH', label: '크기' },
  { key: 'weightKg', label: '무게' },
];

export default function SpecSummary({
  product,
  insights,
  minFee,
}: {
  product: ProductDetail;
  insights: ProductInsights | undefined;
  minFee: number;
}) {
  // 값이 있는 스펙만 최대 3개 — 4칸 중 첫 칸은 가격이 차지한다
  const slots = SPEC_SLOTS[product.category.slug] ?? FALLBACK_SLOTS;
  const specCells = slots.map((slot) => ({
    label: slot.label,
    value: product.specs[slot.key],
  }))
    .map((c) => ({ label: c.label, value: typeof c.value === 'number' ? String(c.value) : c.value }))
    .filter((c): c is { label: string; value: string } => typeof c.value === 'string' && c.value !== '')
    .slice(0, 3);

  const cheaperThan = insights ? insights.total - insights.rank : 0;

  return (
    <div className="space-y-8">
      {insights && insights.total > 1 && (
        <p className="text-xl lg:text-2xl font-bold text-[#333d4b] leading-snug">
          {insights.categoryName} {insights.total}개 중{' '}
          <span className="text-[var(--action-primary)]">{insights.rank}번째로 저렴해요</span>
        </p>
      )}

      {/* 가격 위치 막대 */}
      {insights && insights.categoryMaxFee > insights.categoryMinFee && (
        <PriceRangeBar
          min={insights.categoryMinFee}
          max={insights.categoryMaxFee}
          value={minFee}
          cheaperThan={cheaperThan}
        />
      )}

      {/* 핵심 스펙 */}
      <dl className="grid grid-cols-2 sm:grid-cols-4 rounded-2xl bg-[#f8f9fb] divide-x divide-y sm:divide-y-0 divide-white">
        <div className="p-5">
          <dd className="text-lg font-bold text-[#333d4b]">월 {minFee.toLocaleString()}원</dd>
          <dt className="mt-1 text-xs text-gray-500">최저 조건</dt>
        </div>
        {specCells.map((cell) => (
          <div key={cell.label} className="p-5">
            <dd className="text-lg font-bold text-[#333d4b] break-keep">{cell.value}</dd>
            <dt className="mt-1 text-xs text-gray-500">{cell.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}

function PriceRangeBar({
  min,
  max,
  value,
  cheaperThan,
}: {
  min: number;
  max: number;
  value: number;
  cheaperThan: number;
}) {
  // 양 끝에서 라벨이 잘리지 않도록 4~96% 안에 가둔다
  const pct = Math.min(96, Math.max(4, ((value - min) / (max - min)) * 100));

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-sm font-bold text-[#333d4b]">같은 카테고리 안에서의 가격 위치</p>
        {cheaperThan > 0 && (
          <p className="text-xs text-gray-500">{cheaperThan.toLocaleString()}개보다 저렴</p>
        )}
      </div>

      <div className="relative pt-7 pb-1">
        {/* 현재 위치 말풍선 */}
        <div
          className="absolute top-0 -translate-x-1/2 whitespace-nowrap"
          style={{ left: `${pct}%` }}
        >
          <span className="inline-block px-2.5 py-1 rounded-lg bg-[#333d4b] text-white text-xs font-bold">
            {value.toLocaleString()}원
          </span>
        </div>

        <div className="relative h-2 rounded-full bg-gradient-to-r from-[#ffd7e3] via-[#f1f3f5] to-[#e5e8eb]">
          <span
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[var(--action-primary)] ring-4 ring-white shadow"
            style={{ left: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between text-xs text-gray-400">
        <span>최저 {min.toLocaleString()}원</span>
        <span>최고 {max.toLocaleString()}원</span>
      </div>
    </div>
  );
}
