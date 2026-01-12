'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import Image from 'next/image';
import Link from 'next/link';
import {
  PartnersCTA,
} from '@/app/landing/components';
import { config } from './config';

interface KbCardLandingProps {
  marketerCode: string;
  template: string;
  subtype: string;
}

// Contact 페이지 URL 생성 헬퍼
const getContactUrl = (marketerCode: string, template: string, subtype: string) =>
  `/${marketerCode}/${template}/contact?from=${subtype}`;

// KB 카드 랜딩 콘텐츠
const kbCardContent = {
  // 카드 상세 정보
  cards: [
    {
      name: 'KB국민 SK내트럭 유가보조금카드',
      imageUrl: 'https://www.truck-kbcard.com/img/main/card1.png',
      tags: ['연회비 면제', 'SK에너지', '유가보조금'],
      benefits: [
        {
          title: 'SK에너지 리터당 30~100원 주유할인 혜택',
          highlight: true,
        },
        {
          title: '부가세 환급신고 편의 서비스',
          highlight: false,
        },
      ],
      description: '주유청구할인 서비스는 전월 이용실적에 따라 차등 적용됩니다.',
      notes: [
        '※ 월간 할인한도 적용기간 : 매월 1일~말일',
        '※ 할인되는 전표가 매입되는 순서대로 월간 할인한도 내에서 차감 (월간 잔여 할인한도 이월되지 않음)',
        '※ SK에너지 화물특화주유소 확인은 홈페이지 (www.enclean.com) 참조',
      ],
    },
    {
      name: 'KB국민 스타트럭II GS칼텍스카드',
      imageUrl: 'https://www.truck-kbcard.com/img/main/card2.png',
      tags: ['연회비 면제', 'GS칼텍스', '유가보조금'],
      benefits: [
        {
          title: 'GS칼텍스 화물특화 주유소 40~80원 주유 할인',
          highlight: true,
        },
        {
          title: '부가세 환급신고 편의 서비스',
          highlight: false,
        },
      ],
      description: 'GS칼텍스 화물특화 주유소에서 경유 주유 시 전월 기준리터 충족여부에 따라 리터당 40원 또는 80원 할인됩니다.',
      notes: [
        "※ GS칼텍스 화물특화 주유소는 GS칼텍스 홈페이지(www.kixx.co.kr) > 주유소/충전소 찾기 항목에서 구분선택 '화물특화 주유소'를 선택하여 확인하실 수 있습니다.",
      ],
    },
    {
      name: 'KB국민 스타트럭 플러스 현대오일뱅크카드',
      imageUrl: 'https://www.truck-kbcard.com/img/main/card4.png',
      tags: ['연회비 면제', '현대오일뱅크', '유가보조금'],
      benefits: [
        {
          title: '현대오일뱅크 화물차 주유 시 리터당 20~85원 할인 및 정유사 포인트 적립',
          highlight: true,
        },
        {
          title: '생활 편의서비스 2~25% 할인 (대형마트, 커피전문점, 자동차정비)',
          highlight: false,
        },
        {
          title: '부가세 환급신고 편의 서비스',
          highlight: false,
        },
      ],
      description: '',
      notes: [
        '※ 현장할인 및 정유사 포인트 적립은 전월 이용실적 및 한도 제한 없음',
        '※ 3대 대형마트 : 이마트, 롯데마트, 홈플러스 / 커피전문점 업종(스타벅스, 커피빈 등) / 자동차 정비 업종(차량정비/부품 등)',
        '※ 단, 온라인 쇼핑몰, 상품권 구매 및 건물내 임대매장, SSM(이마트에브리데이, 홈플러스 익스프레스, 롯데 슈퍼 등) 이용금액 할인 제외',
      ],
    },
  ],
  reviews: [
    {
      id: 'kim****',
      content: '화물차 운전 시작하면서 바로 만들었어요. 유가보조금 꼬박꼬박 잘 들어오고, 주유 할인도 쏠쏠해서 만족합니다.',
    },
    {
      id: 'par**',
      content: '다른 카드 쓰다가 넘어왔는데 연회비 없는 게 제일 좋네요. 부가세 환급 자료도 챙겨주니 신경 쓸 게 줄었어요.',
    },
    {
      id: 'lee*****',
      content: '상담 신청하고 빠르게 발급받았습니다. 친절하게 설명해주셔서 어떤 카드가 저한테 맞는지 잘 골랐어요.',
    },
    {
      id: 'cho**',
      content: '주유소 브랜드별로 혜택이 있어서 제가 자주 가는 곳 카드로 만들었어요. 굿굿',
    },
  ],
  cta: {
    title: '아직 고민되시나요?',
    description: '전문 상담원이 사장님께 딱 맞는 카드를 찾아드립니다.',
    ctaText: '빠른 상담 신청',
  },
};

// 상단 심플 헤더
const SimpleHeader = () => (
  <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 h-16 lg:h-20 flex items-center justify-center shadow-sm">
    <div className="relative w-40 h-8 lg:w-48 lg:h-10">
      <Image
        src="https://cdn.thefairnews.co.kr/news/photo/202404/26172_60797_4838.jpg"
        alt="KB 국민카드"
        fill
        className="object-contain"
        priority
      />
    </div>
  </header>
);

// 카드 상세 섹션 컴포넌트
const CardDetailSection = ({ contactUrl }: { contactUrl: string }) => {
  return (
    <section className="py-12 lg:py-20 bg-gray-50">
      <div className="max-w-[1000px] mx-auto px-6">
        <div className="text-center mb-12 animate-on-scroll opacity-0 translate-y-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
            나에게 딱 맞는 혜택을 골라보세요
          </h2>
          <p className="text-base lg:text-lg text-gray-600">
            유가보조금 지원은 기본, 주유소별 추가 할인을 확인하세요
          </p>
        </div>

        <div className="space-y-12">
          {kbCardContent.cards.map((card, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 animate-on-scroll opacity-0 translate-y-8 flex flex-col"
              style={{ transitionDelay: `${idx * 100}ms` }}
            >
              <div className="flex flex-col lg:flex-row flex-grow">
                {/* 카드 이미지 영역 */}
                <div className="lg:w-2/5 p-8 lg:p-10 bg-[#f8f9fa] flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-gray-100 relative group">
                  <div className="relative w-48 lg:w-56 transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-2">
                    {/* 카드 그림자 효과 */}
                    <div className="absolute inset-0 rounded-xl bg-black/20 blur-xl translate-y-4 scale-90" />
                    <img 
                      src={card.imageUrl} 
                      alt={card.name} 
                      className="relative w-full h-auto drop-shadow-xl z-10"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-8 justify-center">
                    {card.tags.map((tag, tIdx) => (
                      <span key={tIdx} className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        tag === '연회비 면제' 
                          ? 'bg-[#fff8e8] text-[#ffbc00]' 
                          : 'bg-white border border-gray-200 text-gray-600'
                      }`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 카드 정보 영역 */}
                <div className="lg:w-3/5 p-8 lg:p-10 flex flex-col">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    {card.name}
                  </h3>
                  
                  {/* 주요 혜택 리스트 */}
                  <div className="space-y-4 mb-8 flex-grow">
                    {card.benefits.map((benefit, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-3">
                        <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${benefit.highlight ? 'bg-[#ffbc00]' : 'bg-gray-300'}`} />
                        <p className={`${benefit.highlight ? 'text-xl font-bold text-[#333d4b]' : 'text-base font-medium text-gray-600'}`}>
                          {benefit.title}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* 설명 및 주의사항 */}
                  <div className="space-y-4 pt-6 border-t border-gray-100 mb-8">
                    {card.description && (
                      <p className="text-sm text-gray-600 leading-relaxed font-medium">
                        {card.description}
                      </p>
                    )}
                    <div className="space-y-1.5">
                      {card.notes.map((note, nIdx) => (
                        <p key={nIdx} className="text-xs text-gray-400 leading-relaxed tracking-tight">
                          {note}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* 발급 신청 버튼 */}
                  <Link
                    href={contactUrl}
                    className="w-full bg-[#ffbc00] hover:bg-[#e5a900] text-gray-900 font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-sm hover:shadow-md"
                  >
                    이 카드로 발급 신청하기
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// 마퀴 리뷰 카드 (재사용)
const MarqueeReviewCard = ({ review }: { review: { id: string; content: string } }) => (
  <div className="flex-shrink-0 w-[320px] bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
    <p className="text-sm font-medium text-[#ffbc00] mb-3">{review.id}</p>
    <p className="text-gray-700 leading-relaxed text-[15px]">{review.content}</p>
  </div>
);

// 리뷰 섹션 (재사용)
const ReviewsSection = ({ reviews }: { reviews: { id: string; content: string }[] }) => {
  const duplicatedReviews = [...reviews, ...reviews, ...reviews];

  return (
    <section className="relative py-16 lg:py-24 bg-white overflow-hidden border-t border-gray-100">
      <div className="max-w-4xl mx-auto px-5 relative z-10">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 text-center mb-4">
          이미 많은 사장님들이<br />혜택을 받고 계세요
        </h2>
      </div>

      <div className="mt-10 relative">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="flex gap-5 animate-marquee hover:pause-animation">
          {duplicatedReviews.map((review, index) => (
            <MarqueeReviewCard key={index} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default function KbCardLanding({ marketerCode, template, subtype }: KbCardLandingProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
            entry.target.classList.remove('opacity-0', 'translate-y-8');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  const contactUrl = getContactUrl(marketerCode, template, subtype);

  return (
    <>
      {/* Pixel (Optional) */}
      {config.tracking.kakaoPixelId && (
        <Script
          id="kakao-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              kakaoPixel('${config.tracking.kakaoPixelId}').pageView();
            `,
          }}
        />
      )}

      <div className="min-h-screen bg-gray-50">
        {/* 심플 헤더로 대체 */}
        <SimpleHeader />

        {/* 카드 상세 리스트 + 발급 버튼 */}
        <CardDetailSection contactUrl={contactUrl} />

        <ReviewsSection reviews={kbCardContent.reviews} />

        <PartnersCTA
          title={kbCardContent.cta.title}
          description={kbCardContent.cta.description}
          ctaText={kbCardContent.cta.ctaText}
          ctaHref={contactUrl}
        />
        
        {/* 푸터 제거 */}
      </div>

      <style jsx global>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(32px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }

        .animate-marquee {
          animation: marquee 20s linear infinite;
        }

        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </>
  );
}