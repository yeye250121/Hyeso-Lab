import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import ApplyForm from '@/components/electronics/ApplyForm';
import { getProductsForCategory } from '@/lib/electronicsApi';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// 셀프 가입 신청서(6단계). 상담 신청(명세서) 뒤 알림톡으로 받은 링크(?lead=)로 들어오면
// 이름·전화번호·고른 상품이 미리 채워진다. 리드 id 는 UUID 라 추측할 수 없다.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: '신청서 작성하기 | 혜택 연구소',
  description: '가전 렌탈 신청서를 직접 작성하세요. 접수 후 담당자가 확인해 연락드립니다.',
};

interface PageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

function firstValue(v?: string | string[]): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

type LeadPrefill = {
  id: string;
  applicant_name: string | null;
  phone_number: string;
  category_slug: string | null;
  contract_months: number | null;
  care_type: string | null;
  plan_id: string | null;
  product_snapshot: { slug?: string } | null;
};

async function loadLead(leadId: string | undefined): Promise<LeadPrefill | null> {
  if (!leadId || !/^[0-9a-f-]{36}$/i.test(leadId)) return null;
  const { data, error } = await getSupabaseAdmin()
    .from('leads')
    .select('id, applicant_name, phone_number, category_slug, contract_months, care_type, plan_id, product_snapshot')
    .eq('id', leadId)
    .maybeSingle();
  if (error) {
    console.error('[application] lead load failed:', error.message);
    return null;
  }
  return (data as LeadPrefill | null) ?? null;
}

export default async function ApplicationPage({ searchParams }: PageProps) {
  const lead = await loadLead(firstValue(searchParams?.lead));

  const productSlug = firstValue(searchParams?.product) ?? lead?.product_snapshot?.slug;
  const category = firstValue(searchParams?.category) ?? lead?.category_slug ?? 'water-purifier';
  // 상품 선택기에 쓸 목록. 요금제는 이미 요약본이라 가볍다.
  const products = await getProductsForCategory(category);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 w-full">
        <ApplyForm
          products={products}
          initialProductSlug={productSlug}
          initialPlanId={firstValue(searchParams?.plan) ?? lead?.plan_id ?? undefined}
          initialContractMonths={
            Number(firstValue(searchParams?.months)) || lead?.contract_months || undefined
          }
          initialCareType={firstValue(searchParams?.care) ?? lead?.care_type ?? undefined}
          initialCategory={category}
          initialApplicantName={lead?.applicant_name ?? undefined}
          initialPhoneNumber={lead?.phone_number}
          leadId={lead?.id}
        />
      </main>
      {/* 모바일은 하단 고정 버튼이 푸터를 가리므로 숨긴다 */}
      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  );
}
