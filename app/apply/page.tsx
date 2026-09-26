import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import LeadForm, { type LeadProduct, type LeadService } from '@/components/shared/LeadForm';
import { getAllProducts } from '@/lib/electronicsApi';

// 사이트 공통 상담 신청(명세서) 입구. 메인 히어로·푸터·가전 상세가 모두 여기로 온다.
// searchParams 를 서버에서 읽어 props 로 넘긴다. 클라이언트에서 useSearchParams 를
// 쓰면 이 라우트가 통째로 클라이언트 렌더링으로 폴백된다(카드 목록에서 겪은 것).
export const revalidate = 3600;

export const metadata = {
  title: '상담 신청 | 혜택 연구소',
  description: '전화번호만 남기면 혜택연구소 전문가가 오늘 중 연락드립니다.',
};

const SERVICES: LeadService[] = ['card', 'internet', 'electronics'];

interface PageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

function firstValue(v?: string | string[]): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ApplyPage({ searchParams }: PageProps) {
  const productSlug = firstValue(searchParams?.product);
  const serviceParam = firstValue(searchParams?.service);
  const initialService = SERVICES.includes(serviceParam as LeadService)
    ? (serviceParam as LeadService)
    : undefined;

  // 가전렌탈 상세에서 넘어온 경우에만 상품 하나를 찾는다. 목록은 캐시돼 있어 가볍다.
  const found = productSlug ? (await getAllProducts()).find((p) => p.slug === productSlug) : undefined;
  const initialProduct: LeadProduct | null = found
    ? {
        slug: found.slug,
        brand: found.brand,
        display_name: found.display_name,
        category_slug: found.category_slug,
        minFee: found.minFee,
      }
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 w-full bg-[linear-gradient(180deg,#ffffff_0%,#fff3f6_100%)]">
        <div className="max-w-[1100px] mx-auto px-6 py-8 lg:py-16 grid lg:grid-cols-[1fr_440px] gap-8 lg:gap-16 items-center">
          <section className="text-center lg:text-left">
            <h1 className="text-[28px] leading-[1.3] lg:text-[44px] lg:leading-[1.25] font-semibold text-[#333d4b] tracking-[-0.02em]">
              놓치고 있던 혜택,
              <br />
              30초 상담 신청
            </h1>
            <p className="mt-4 text-[15px] lg:text-lg text-[#6b7684] leading-relaxed">
              전화번호만 남기면 전문가가 오늘 중 연락드려요.
            </p>
          </section>

          <section className="rounded-3xl bg-white shadow-[0_8px_32px_rgba(51,61,75,0.08)]">
            <LeadForm
              initialService={initialService}
              initialProduct={initialProduct}
              initialPlanId={firstValue(searchParams?.plan)}
              initialContractMonths={Number(firstValue(searchParams?.months)) || undefined}
              initialCareType={firstValue(searchParams?.care)}
              initialCategory={firstValue(searchParams?.category)}
            />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
