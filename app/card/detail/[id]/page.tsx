import { getCardById, getAllCards } from '@/lib/cardApi';
import { notFound } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { CreditCard, Info, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface CardDetailPageProps {
  params: {
    id: string;
  };
}

// 빌드 시점에 모든 174개 카드의 HTML을 미리 생성하여 로딩 속도 극대화
export function generateStaticParams() {
  const cards = getAllCards();
  return cards.map((card) => ({
    id: card.id,
  }));
}

export default function CardDetailPage({ params }: CardDetailPageProps) {
  const decodedId = decodeURIComponent(params.id);
  const card = getCardById(decodedId);

  if (!card) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 max-w-[1000px] mx-auto px-6 pt-10 pb-24 w-full">
        {/* 상단 섹션 (상세 정보 + 이미지) */}
        <div className="flex flex-col-reverse md:flex-row gap-12 mb-20 items-stretch">
          
          {/* 좌측: 상세 정보 */}
          <div className="flex-1 flex flex-col w-full">
            {/* 뱃지 */}
            <div className="flex gap-2 mb-4">
              <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-semibold">{card.company}</span>
              <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-semibold">{card.type}</span>
            </div>
            
            {/* 타이틀 */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">{card.name}</h1>
            
            {/* 프로모션 배너 */}
            {card.promo && (
              <div className="bg-[#eff4ff] rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <p className="text-gray-500 text-sm mb-1">{card.name} 이용 시</p>
                  <p className="text-blue-600 font-bold">{card.promo}</p>
                </div>
                <button className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors w-full sm:w-auto">
                  이벤트 보기
                </button>
              </div>
            )}
            
            {/* 혜택 요약 박스 */}
            <div className="bg-[#f8f9fa] rounded-xl p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🎁</span> 혜택 요약
              </h3>
              <ul className="space-y-2.5">
                {card.benefits.map((benefit, idx) => (
                  <li key={idx} className="text-gray-600 text-[15px]">{benefit}</li>
                ))}
              </ul>
            </div>
            
            {/* 연회비 및 실적 */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-2.5 text-[14px] text-gray-500">
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>{card.fees}</span>
              </div>
              <div className="flex items-center gap-2.5 text-[14px] text-gray-500">
                <Info className="w-4 h-4 shrink-0" />
                <span>{card.condition}</span>
              </div>
            </div>
            
            {/* CTA 버튼 */}
            <button className="w-full bg-[var(--action-primary)] text-white font-bold py-4 rounded-xl text-lg hover:bg-[var(--action-primary-hover)] transition-colors shadow-lg shadow-pink-100">
              카드 자세히 보기
            </button>
          </div>

          {/* 우측: 카드 이미지 */}
          <div className="flex-1 flex flex-col justify-center items-center shrink-0 w-full">
            {/* TODO: 실제 카드 이미지 매핑 전 임시 이미지 (기존 대비 130% 확대) */}
            <div className="w-40 h-[220px] md:w-48 md:h-[286px] rounded-2xl shadow-xl flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600 text-white font-bold text-xl p-5 text-center transform transition-transform hover:scale-105">
              {card.name}
            </div>
          </div>

        </div>

        {/* 하단 섹션 (주요혜택 리스트) */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">주요혜택</h2>
          <div className="border-t-2 border-gray-900">
            {card.benefits.map((benefit, i) => {
              // 혜택 문자열에서 첫 번째 단어(키워드) 추출
              const keyword = benefit.split(' ')[0] || `혜택 ${i + 1}`;
              
              return (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between py-6 border-b border-gray-200 cursor-pointer hover:bg-gray-50 group transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center flex-1 gap-2 sm:gap-0 mr-4">
                    <span className="sm:w-1/3 font-bold text-gray-900 text-lg sm:text-base">{keyword}</span>
                    <span className="sm:w-2/3 text-gray-600">{benefit}</span>
                  </div>
                  <div className="flex items-center justify-end shrink-0 whitespace-nowrap text-gray-400 text-sm mt-3 sm:mt-0 group-hover:text-gray-600 transition-colors">
                    자세히 <ChevronDown className="w-4 h-4 ml-1" />
                  </div>
                </div>
              );
            })}
            
            {/* 유의사항 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-6 border-b border-gray-200 cursor-pointer hover:bg-gray-50 group transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center flex-1 gap-2 sm:gap-0 mr-4">
                <span className="sm:w-1/3 font-bold text-gray-900 text-lg sm:text-base">유의사항</span>
                <span className="sm:w-2/3 text-gray-600">꼭 확인해주세요!</span>
              </div>
              <div className="flex items-center justify-end shrink-0 whitespace-nowrap text-gray-400 text-sm mt-3 sm:mt-0 group-hover:text-gray-600 transition-colors">
                자세히 <ChevronDown className="w-4 h-4 ml-1" />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
