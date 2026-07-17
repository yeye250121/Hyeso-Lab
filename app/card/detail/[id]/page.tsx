import { getCardById, getAllCards } from '@/lib/cardApi';
import { notFound } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { CreditCard, Info, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CardImageGallery from '@/components/card/CardImageGallery';

interface CardDetailPageProps {
  params: {
    id: string;
  };
}

export const revalidate = 0;


// 빌드 시점에 모든 174개 카드의 HTML을 미리 생성하여 로딩 속도 극대화
export async function generateStaticParams() {
  const cards = await getAllCards();
  return cards.map((card) => ({
    id: card.id,
  }));
}

export default async function CardDetailPage({ params }: CardDetailPageProps) {
  const decodedId = decodeURIComponent(params.id);
  const card = await getCardById(decodedId);

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
                {card.benefits && card.benefits.slice(0, 3).map((benefit, idx) => {
                  const title = typeof benefit === 'string' ? benefit : benefit?.title || '';
                  return <li key={idx} className="text-gray-600 text-[15px]">{title}</li>;
                })}
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
            {card.card_image_urls && card.card_image_urls.length > 0 ? (
              <CardImageGallery images={card.card_image_urls} alt={card.name} />
            ) : card.card_image_url ? (
              <div className="w-[260px] h-[260px] md:w-[340px] md:h-[340px] relative transform transition-transform hover:scale-105">
                <Image src={card.card_image_url} alt={card.name} fill className="object-contain drop-shadow-2xl" />
              </div>
            ) : (
              <div className="w-[260px] h-[160px] md:w-[320px] md:h-[200px] rounded-2xl shadow-xl flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600 text-white font-bold text-xl p-5 text-center transform transition-transform hover:scale-105">
                {card.name}
              </div>
            )}
          </div>

        </div>

        {/* 하단 섹션 (주요혜택 리스트) */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">주요 혜택</h2>
          <div className="border-t-2 border-gray-900">
            {card.main_benefits && card.main_benefits.map((benefit, i) => {
              const category = benefit.category || `혜택 ${i + 1}`;
              const title = benefit.title || '';
              const content = benefit.content || '';

              return (
                <details key={i} className="group border-b border-gray-200">
                  <summary className="flex flex-col sm:flex-row sm:items-center justify-between py-6 cursor-pointer hover:bg-gray-50 transition-colors list-none">
                    <div className="flex flex-col sm:flex-row sm:items-center flex-1 gap-2 sm:gap-4 mr-4">
                      <span className="sm:w-1/3 font-extrabold text-gray-900 text-xl sm:text-lg">{category}</span>
                      <span className="sm:w-2/3 text-gray-500 text-lg">{title}</span>
                    </div>
                    <div className="flex items-center justify-end shrink-0 text-gray-400 mt-3 sm:mt-0 group-hover:text-gray-900 transition-colors">
                      <div className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ChevronDown className="w-5 h-5 transform group-open:rotate-180 transition-transform duration-300" />
                      </div>
                    </div>
                  </summary>
                  <div className="pb-6 pt-2 px-4 sm:px-0 sm:pl-[33%] mb-4">
                    <div className="bg-gray-50 rounded-xl p-5 sm:p-6 text-gray-700 text-sm leading-snug overflow-x-auto [&_p]:my-1.5 [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5 [&>table]:w-full [&>table]:border-collapse [&>table]:my-3 [&_th]:border [&_th]:border-gray-200 [&_th]:bg-gray-100 [&_th]:p-2 [&_th]:text-gray-900 [&_td]:border [&_td]:border-gray-200 [&_td]:p-2">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                      >
                        {content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </details>
              );
            })}


          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
