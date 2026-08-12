import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Droplets } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { getProductBySlug } from '@/lib/electronicsApi';
import PlanSelector from '@/components/electronics/PlanSelector';

export const revalidate = 3600;

interface PageProps {
  params: { category: string; slug: string };
}

const SPEC_LABELS: Record<string, string> = {
  productType: '제품 유형',
  purifyFunction: '정수 기능',
  waterType: '정수 타입',
  colors: '색상',
  channel: '판매 채널',
  businessUse: '업소용',
};

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

  const image = product.image_urls?.[0];
  const specRows = Object.entries(product.specs)
    .filter(([, v]) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0))
    .map(([k, v]) => [
      SPEC_LABELS[k] ?? k,
      Array.isArray(v) ? v.join(', ') : typeof v === 'boolean' ? (v ? '예' : '아니오') : String(v),
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

            {specRows.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-bold text-[#333d4b] mb-4">제품 정보</h2>
                <dl className="rounded-2xl border border-gray-100 divide-y divide-gray-100">
                  <div className="flex px-5 py-3.5 text-sm">
                    <dt className="w-28 text-gray-500 shrink-0">브랜드</dt>
                    <dd className="font-medium text-[#333d4b]">{product.brand}</dd>
                  </div>
                  <div className="flex px-5 py-3.5 text-sm">
                    <dt className="w-28 text-gray-500 shrink-0">모델명</dt>
                    <dd className="font-medium text-[#333d4b] break-all">{product.model_code}</dd>
                  </div>
                  {specRows.map(([label, value]) => (
                    <div key={label} className="flex px-5 py-3.5 text-sm">
                      <dt className="w-28 text-gray-500 shrink-0">{label}</dt>
                      <dd className="font-medium text-[#333d4b]">{value}</dd>
                    </div>
                  ))}
                  <div className="flex px-5 py-3.5 text-sm">
                    <dt className="w-28 text-gray-500 shrink-0">선택 가능 조건</dt>
                    <dd className="font-medium text-[#333d4b]">{product.plans.length}가지</dd>
                  </div>
                </dl>
              </div>
            )}
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
      </main>

      <Footer />
    </div>
  );
}
