import Navbar from '@/components/shared/Navbar';
import ApplyForm from '@/components/electronics/ApplyForm';
import { getAllProducts, getProductsForCategory } from '@/lib/electronicsApi';
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
  // 상품만 넘어온 경우(상세의 신청 버튼) 그 상품의 카테고리를 찾아 쓴다.
  // 찾지 않으면 정수기 목록만 불러와서, 비데·공기청정기 상품은 미리 선택되지 않는다.
  let category = firstValue(searchParams?.category) ?? lead?.category_slug ?? undefined;
  if (!category && productSlug) {
    category = (await getAllProducts()).find((p) => p.slug === productSlug)?.category_slug;
  }
  category ??= 'water-purifier';
  // 상품 선택기에 쓸 목록. 요금제는 이미 요약본이라 가볍다.
  const products = await getProductsForCategory(category);

  const form = (embedded: boolean) => (
    <ApplyForm
      products={products}
      initialProductSlug={productSlug}
      initialPlanId={firstValue(searchParams?.plan) ?? lead?.plan_id ?? undefined}
      initialContractMonths={Number(firstValue(searchParams?.months)) || lead?.contract_months || undefined}
      initialCareType={firstValue(searchParams?.care) ?? lead?.care_type ?? undefined}
      initialCategory={category}
      initialApplicantName={lead?.applicant_name ?? undefined}
      initialPhoneNumber={lead?.phone_number}
      leadId={lead?.id}
      embedded={embedded}
    />
  );

  // 상품 상세의 서랍(iframe)에서 열릴 때는 폼만 그린다. 서랍이 틀 역할을 한다.
  if (firstValue(searchParams?.embed) === '1') {
    return <div className="min-h-screen bg-white">{form(true)}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white lg:bg-[#f2f4f6]">
      <Navbar />
      {/* 데스크톱에서도 폼은 모바일 화면 크기의 틀 안에서 쓴다.
          틀에 transform 을 걸면 폼 안의 position: fixed(하단 버튼·주소 모달)가
          뷰포트가 아니라 이 틀을 기준으로 잡혀서, 모바일과 똑같이 동작한다. */}
      <main className="flex-1 w-full lg:flex lg:items-start lg:justify-center lg:py-6">
        <div className="lg:w-[430px] lg:h-[min(880px,calc(100vh-7rem))] lg:rounded-[28px] lg:bg-white lg:shadow-[0_12px_40px_rgba(51,61,75,0.12)] lg:overflow-hidden lg:[transform:translateZ(0)]">
          <div className="lg:h-full lg:overflow-y-auto">
            {form(false)}
          </div>
        </div>
      </main>
    </div>
  );
}
