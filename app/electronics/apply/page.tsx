import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import ApplyForm from '@/components/electronics/ApplyForm';
import { getProductsForCategory } from '@/lib/electronicsApi';

// searchParams 를 서버에서 읽어 props 로 넘긴다. 클라이언트에서 useSearchParams 를
// 쓰면 이 라우트가 통째로 클라이언트 렌더링으로 폴백된다(카드 목록에서 겪은 것).
export const revalidate = 3600;

export const metadata = {
  title: '렌탈 신청 | 혜택 연구소',
  description: '가전 렌탈 상담을 신청하세요. 조건에 맞는 상품을 안내해 드립니다.',
};

interface PageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

function firstValue(v?: string | string[]): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ApplyPage({ searchParams }: PageProps) {
  const category = firstValue(searchParams?.category) ?? 'water-purifier';
  // 상품 선택기에 쓸 목록. 요금제는 이미 요약본이라 가볍다.
  const products = await getProductsForCategory(category);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 w-full">
        <ApplyForm
          products={products}
          initialProductSlug={firstValue(searchParams?.product)}
          initialPlanId={firstValue(searchParams?.plan)}
          initialCategory={category}
        />
      </main>
      <Footer />
    </div>
  );
}
