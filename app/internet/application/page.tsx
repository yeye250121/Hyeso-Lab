import Navbar from '@/components/shared/Navbar';
import InternetApplyForm from '@/components/internet/InternetApplyForm';
import { getCarriers, getInternetProducts } from '@/lib/internetApi';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// 인터넷 셀프 가입 신청서. 설정기·추천의 "신청하기"(?product=)로 들어오면 상품이 미리 채워진다.
// 상담 신청(명세서) 뒤 알림톡 링크(?lead=)로 들어오면 이름·전화번호가 미리 채워진다.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: '인터넷 신청서 작성하기 | 혜택 연구소',
  description: '인터넷·TV 가입 신청서를 직접 작성하세요. 접수 후 담당자가 확인해 연락드립니다.',
};

interface PageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}
const first = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

async function loadLead(leadId: string | undefined) {
  if (!leadId || !/^[0-9a-f-]{36}$/i.test(leadId)) return null;
  const { data, error } = await getSupabaseAdmin().from('leads').select('id, applicant_name, phone_number').eq('id', leadId).maybeSingle();
  if (error) {
    console.error('[internet/application] lead load failed:', error.message);
    return null;
  }
  return data as { id: string; applicant_name: string | null; phone_number: string } | null;
}

export default async function InternetApplicationPage({ searchParams }: PageProps) {
  const [carriers, products, lead] = await Promise.all([getCarriers(), getInternetProducts(), loadLead(first(searchParams?.lead))]);
  const consumerCarriers = carriers.filter((c) => !c.business_only);
  const consumerProducts = products.filter((p) => consumerCarriers.some((c) => c.id === p.carrier_id));
  const productId = first(searchParams?.product);
  // 소호 상품 링크로 들어온 경우도 신청은 되게 그 상품만 끼워 넣는다
  const extra = productId && !consumerProducts.some((p) => p.id === productId) ? products.filter((p) => p.id === productId) : [];
  const extraCarriers = extra.map((p) => carriers.find((c) => c.id === p.carrier_id)!).filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col bg-white lg:bg-[#f2f4f6]">
      <Navbar />
      <main className="flex-1 w-full lg:flex lg:items-start lg:justify-center lg:py-6">
        <div className="lg:w-[430px] lg:h-[min(880px,calc(100vh-7rem))] lg:rounded-[28px] lg:bg-white lg:shadow-[0_12px_40px_rgba(51,61,75,0.12)] lg:overflow-hidden lg:[transform:translateZ(0)]">
          <div className="lg:h-full lg:overflow-y-auto">
            <InternetApplyForm
              carriers={[...consumerCarriers, ...extraCarriers]}
              products={[...consumerProducts, ...extra]}
              initialProductId={productId}
              initialApplicantName={lead?.applicant_name ?? undefined}
              initialPhoneNumber={lead?.phone_number}
              leadId={lead?.id}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
