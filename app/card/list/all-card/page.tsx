import { getAllCards } from '@/lib/cardApi';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import CardListFilter from '@/components/card/CardListFilter';

export default function AllCardPage() {
  const allCards = getAllCards();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 max-w-[800px] mx-auto px-6 pt-10 pb-24 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">전체 카드</h1>
          <p className="text-gray-500">나에게 딱 맞는 조건의 카드를 빠르게 찾아보세요.</p>
        </div>

        {/* 클라이언트 사이드 필터 및 리스트 렌더링 컴포넌트 */}
        <CardListFilter initialCards={allCards} />
      </main>

      <Footer />
    </div>
  );
}
