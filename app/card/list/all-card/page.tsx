import { getCardsForList } from '@/lib/cardApi';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import CardListFilter from '@/components/card/CardListFilter';

// searchParams 를 서버에서 읽으므로 이 라우트는 동적으로 렌더링된다.
// 클라이언트에서 useSearchParams 로 읽으면 정적 렌더링이 클라이언트 렌더링으로
// 폴백되어 카드 목록이 HTML 에서 빠지기 때문에, 서버에서 직접 읽어 넘긴다.
// 카드 데이터 자체는 getCardsForList 의 unstable_cache 가 캐시한다.

interface AllCardPageProps {
  searchParams?: {
    company?: string | string[];
    q?: string | string[];
  };
}

function firstValue(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AllCardPage({ searchParams }: AllCardPageProps) {
  const allCards = await getCardsForList();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 max-w-[800px] mx-auto px-6 pt-10 pb-24 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">전체 카드</h1>
          <p className="text-gray-500">나에게 딱 맞는 조건의 카드를 빠르게 찾아보세요.</p>
        </div>

        {/* 클라이언트 사이드 필터 및 리스트 렌더링 컴포넌트 */}
        <CardListFilter
          initialCards={allCards}
          initialCompany={firstValue(searchParams?.company)}
          initialQuery={firstValue(searchParams?.q)}
        />
      </main>

      <Footer />
    </div>
  );
}
