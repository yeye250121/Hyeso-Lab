import Navbar from '@/components/shared/Navbar';
import RecommendWizard from '@/components/internet/RecommendWizard';
import { getCarriers, getInternetProducts } from '@/lib/internetApi';

// 맞춤 추천. 신청서와 같은 "창" 틀(데스크톱은 모바일 폭 카드) 안에서 질문 몇 개에 답하면
// 추천 상품이 나온다.
export const revalidate = 3600;

export const metadata = {
  title: '나에게 맞는 인터넷 찾기 | 혜택 연구소',
  description: '몇 명이 쓰는지, TV를 보는지만 알려주시면 통신사별로 딱 맞는 요금제를 골라드려요.',
};

export default async function InternetRecommendPage() {
  const [carriers, products] = await Promise.all([getCarriers(), getInternetProducts()]);
  const consumerCarriers = carriers.filter((c) => !c.business_only);
  const consumerProducts = products.filter((p) => consumerCarriers.some((c) => c.id === p.carrier_id));

  return (
    <div className="min-h-screen flex flex-col bg-white lg:bg-[#f2f4f6]">
      <Navbar />
      <main className="flex-1 w-full lg:flex lg:items-start lg:justify-center lg:py-6">
        <div className="lg:w-[430px] lg:h-[min(880px,calc(100vh-7rem))] lg:rounded-[28px] lg:bg-white lg:shadow-[0_12px_40px_rgba(51,61,75,0.12)] lg:overflow-hidden lg:[transform:translateZ(0)]">
          <div className="lg:h-full lg:overflow-y-auto">
            <RecommendWizard carriers={consumerCarriers} products={consumerProducts} />
          </div>
        </div>
      </main>
    </div>
  );
}
