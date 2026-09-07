import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Droplets } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { getProductBySlug, getProductInsights } from '@/lib/electronicsApi';
import PlanSelector from '@/components/electronics/PlanSelector';
import ProductTabs from '@/components/electronics/ProductTabs';
import SpecSummary from '@/components/electronics/SpecSummary';
import PlanBreakdown from '@/components/electronics/PlanBreakdown';
import Recommendations from '@/components/electronics/Recommendations';

const TABS = [
  { id: 'spec', label: '스펙분석' },
  { id: 'detail', label: '상세정보' },
  { id: 'recommend', label: '추천' },
];

export const revalidate = 3600;

interface PageProps {
  params: { category: string; slug: string };
}

const SPEC_LABELS: Record<string, string> = {
  // 공통
  productType: '제품 유형',
  sizeWDH: '크기(WDH)',
  weightKg: '무게',
  colors: '색상',
  channel: '판매 채널',
  businessUse: '업소용',
  // 정수기
  purifyFunction: '정수 기능',
  waterType: '정수 타입',
  filterType: '필터 종류',
  filterCount: '필터 개수',
  hotWaterTemp: '온수 온도',
  features: '편의 기능',
  sterilization: '살균 방식',
  // 공기청정기
  coverageArea: '사용 면적',
  energyGrade: '에너지효율',
  cleanFunctions: '청정 기능',
  sensor: '센서',
  petCare: '펫 케어',
  humidify: '가습',
  dehumidify: '제습',
  heating: '온풍',
  // 비데
  nozzleMaterial: '노즐 소재',
  hotWater: '온수',
  drying: '건조',
  // 매트리스
  bedSize: '사이즈',
  springType: '스프링',
  firmness: '쿠션감',
  zones: '존',
  material: '소재',
};

// 라벨이 없는 키는 내부용(수집 출처 등)이라 화면에 내보내지 않는다.
// coverageBucket 은 필터 전용이라 coverageArea 와 중복 노출된다.
const HIDDEN_SPEC_KEYS = new Set(['sourceModel', 'coverageBucket']);

// 숫자만 들어오는 값에 단위를 붙인다
const SPEC_UNITS: Record<string, string> = { weightKg: 'kg', filterCount: '개' };

export async function generateMetadata({ params }: PageProps) {
  const product = await getProductBySlug(params.slug);
  if (!product) return {};
  const min = Math.min(...product.plans.map((p) => p.monthly_fee));
  return {
    title: `${product.brand} ${product.display_name} 렌탈 | 혜택 연구소`,
    description: `${product.brand} ${product.display_name}(${product.model_code}) 월 ${min.toLocaleString()}원부터. 약정·관리방법별 실제 렌탈료와 총 납부액을 확인하세요.`,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const product = await getProductBySlug(params.slug);
  if (!product || product.plans.length === 0) notFound();

  const insights = await getProductInsights(product);
  const minFee = Math.min(...product.plans.map((p) => p.monthly_fee));

  const image = product.image_urls?.[0];
  const specRows = Object.entries(product.specs)
    .filter(([k, v]) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0))
    .filter(([k]) => !HIDDEN_SPEC_KEYS.has(k) && SPEC_LABELS[k])
    .map(([k, v]) => [
      SPEC_LABELS[k],
      Array.isArray(v)
        ? v.join(', ')
        : typeof v === 'boolean'
          ? v
            ? '예'
            : '아니오'
          : `${v}${SPEC_UNITS[k] ?? ''}`,
    ]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 w-full max-w-[1100px] mx-auto px-6 pt-8 pb-24">
        <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6 flex-wrap">
          <Link href="/electronics" className="hover:text-[#333d4b] transition-colors">
            가전 렌탈
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link
            href={`/electronics/${params.category}`}
            className="hover:text-[#333d4b] transition-colors"
          >
            {product.category.name || params.category}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#333d4b] font-medium truncate max-w-[200px]">
            {product.display_name}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          {/* 좌: 이미지 + 스펙 */}
          <div>
            <div className="relative aspect-square rounded-3xl bg-gradient-to-b from-[#f6f8fb] to-[#eef1f6] flex items-center justify-center overflow-hidden">
              {image ? (
                <Image
                  src={image}
                  alt={product.display_name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain p-10"
                  priority
                />
              ) : (
                <Droplets className="w-20 h-20 text-gray-300" strokeWidth={1.2} />
              )}
            </div>

          </div>

          {/* 우: 요금제 선택 */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <p className="text-sm font-bold text-gray-400">{product.brand}</p>
            <h1 className="mt-1.5 text-2xl lg:text-[32px] font-bold text-[#333d4b] leading-tight">
              {product.display_name}
            </h1>
            <p className="mt-2 text-sm text-gray-400">{product.model_code}</p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {[product.specs.purifyFunction, product.specs.productType, product.specs.waterType]
                .filter(Boolean)
                .map((b) => (
                  <span
                    key={b as string}
                    className="inline-block px-2.5 py-1 rounded-lg bg-gray-50 text-gray-600 text-xs font-medium"
                  >
                    {b}
                  </span>
                ))}
            </div>

            {product.description && (
              <p className="mt-5 text-gray-600 leading-relaxed">{product.description}</p>
            )}

            <div className="mt-8 pt-8 border-t border-gray-100">
              <h2 className="text-lg font-bold text-[#333d4b] mb-5">가입 조건을 선택하세요</h2>
              <PlanSelector plans={product.plans} productSlug={product.slug} />
            </div>
          </div>
        </div>

        {/* 하단 정보 제공 탭 */}
        <div className="mt-16 lg:mt-24">
          <ProductTabs tabs={TABS}>
            <section id="spec" className="scroll-mt-20 pt-10">
              <h2 className="text-xl font-bold text-[#333d4b] mb-6">스펙분석</h2>
              <SpecSummary product={product} insights={insights} minFee={minFee} />
            </section>

            <section id="detail" className="scroll-mt-20 pt-14">
              <h2 className="text-xl font-bold text-[#333d4b] mb-6">상세정보</h2>
              <PlanBreakdown product={product} insights={insights} specRows={specRows} />

            </section>

            <section id="recommend" className="scroll-mt-20 pt-14">
              <h2 className="text-xl font-bold text-[#333d4b] mb-6">추천</h2>
              <Recommendations
                insights={insights}
                categorySlug={product.category.slug || params.category}
                categoryName={product.category.name || '전체'}
              />
            </section>
          </ProductTabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
