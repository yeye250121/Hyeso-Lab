"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CreditCard, Info, SlidersHorizontal, ChevronDown, X, Search } from 'lucide-react';
import type { CardData } from '@/lib/cardApi';

interface CardListFilterProps {
  initialCards: CardData[];
}

const COMPANY_LOGOS: Record<string, string> = {
  '신한카드': 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/logos/app/card/shinhan-card-logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvbG9nb3MvYXBwL2NhcmQvc2hpbmhhbi1jYXJkLWxvZ28ucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4Mzc2OTYwMSwiZXhwIjoxNzg0Mzc0NDAxfQ.JHYWjnBr9MTReZU5IGQC10QscJYkSIWRFN1jGM9FMDA',
  '현대카드': 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/logos/app/card/hyundai-card-logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvbG9nb3MvYXBwL2NhcmQvaHl1bmRhaS1jYXJkLWxvZ28ucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4Mzc2OTc5NSwiZXhwIjoxNzg0Mzc0NTk1fQ.K7CAHbt852GGj7C_LTAmPVZWuL5CLPVSvufT_Tpot6s',
  '롯데카드': 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/logos/app/card/lotte-card-logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvbG9nb3MvYXBwL2NhcmQvbG90dGUtY2FyZC1sb2dvLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODM3Njk1ODQsImV4cCI6MTc4NDM3NDM4NH0.uWHUkpLnOH4kvcPyWQI24PYQ8gDYAYEnveGOYJOL4DY',
  '삼성카드': 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/logos/app/card/samsung-card-logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvbG9nb3MvYXBwL2NhcmQvc2Ftc3VuZy1jYXJkLWxvZ28ucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4Mzc2OTU5NSwiZXhwIjoxNzg0Mzc0Mzk1fQ.xEpRszMNlU9ZXdtxx_CjrhofU7SeAA4go10YDxw1Shs',
  '하나카드': 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/logos/app/card/hana-card-logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvbG9nb3MvYXBwL2NhcmQvaGFuYS1jYXJkLWxvZ28ucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4Mzc2OTU3OCwiZXhwIjoxNzg0Mzc0Mzc4fQ.EvVq7PzB0v1WWJDPBsDcDdKvdL5zy1NReqttJ084jaY',
  'KB국민카드': 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/public/HYESO-LAB/logos/app/card/logo_kbcard.png',
  'BC바로카드': 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/logos/app/card/bc-card-logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvbG9nb3MvYXBwL2NhcmQvYmMtY2FyZC1sb2dvLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODM3Njk1NzMsImV4cCI6MTc4NDM3NDM3M30.Wb7i6FPP4_45LPN2QbOkcrSmKwK1xTTf8anBUSVzXMc',
  '우리카드': 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/logos/app/card/woori-card-logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvbG9nb3MvYXBwL2NhcmQvd29vcmktY2FyZC1sb2dvLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODM3NzA2NjQsImV4cCI6MTc4NDM3NTQ2NH0.TB5kRQRpfEOh0nAdfYXwFz5yP33Xsr9r8Rgoj6uQArU',
  'NH농협카드': 'https://i.namu.wiki/i/NRx2sGZQx0nmZg0ceOGaR4VsK1ESprdayF8d40LAFYn8Lv3adn9qTJFP-pvCLn5c3ZUNgNL05Hyglj4--iMX6w.svg',
  'IBK기업은행': 'https://i.namu.wiki/i/oG-R9lG9Fw7r-VvF5UXY9h-2L3eF7sJ4y4g5kE2S-p9-J0v1qW6R_a7p8rGv8V_fD_6H3-Z5_jO1V8vF0_Z2Q.svg',
};

export default function CardListFilter({ initialCards }: CardListFilterProps) {
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');
  const [typeFilter, setTypeFilter] = useState<'all' | '신용카드' | '체크카드'>('all');
  
  // 처음에 전체카드가 나오도록 'all'로 초기화
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('popular');
  const [isCompanySheetOpen, setIsCompanySheetOpen] = useState(false);
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);

  // 추출된 유니크한 카드사 목록 (전체보기 제외, 우리카드를 무조건 첫 번째로)
  const companies = useMemo(() => {
    const set = new Set(initialCards.map(c => c.company));
    set.delete('우리카드'); // 기존 위치에서 제거
    return ['우리카드', ...Array.from(set)]; // 맨 앞에 추가
  }, [initialCards]);

  // 필터링 및 정렬 로직
  const filteredAndSortedCards = useMemo(() => {
    let result = [...initialCards];

    // 0. 텍스트 검색 필터
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.company.toLowerCase().includes(q) || 
        c.benefits.some(b => (typeof b === 'string' ? b : b?.title || '').toLowerCase().includes(q))
      );
    }

    // 1. 타입 필터
    if (typeFilter !== 'all') {
      result = result.filter(c => c.type === typeFilter);
    }

    // 2. 카드사 필터
    if (companyFilter !== 'all') {
      result = result.filter(c => c.company === companyFilter);
    }

    // 3. 정렬 로직
    if (sortOrder !== 'popular') {
      result.sort((a, b) => {
        if (sortOrder === 'fee') {
          const parseFee = (feeStr: string) => {
            if (!feeStr || feeStr.includes('0원') || feeStr.includes('없음') || feeStr.includes('면제')) return 0;
            const match = feeStr.match(/[0-9,]+/);
            return match ? parseInt(match[0].replace(/,/g, ''), 10) : 0;
          };
          return parseFee(a.fees) - parseFee(b.fees);
        } 
        
        if (sortOrder === 'condition') {
          const parseCondition = (condStr: string) => {
            if (!condStr || condStr.includes('없음')) return 0;
            const match = condStr.match(/([0-9]+)만/);
            return match ? parseInt(match[1], 10) : 999; 
          };
          return parseCondition(a.condition) - parseCondition(b.condition);
        }

        // 'benefit', 'issue' 등은 현재 데이터에 기준값이 명확하지 않으므로 임시로 이름 정렬
        return a.name.localeCompare(b.name);
      });
    }

    return result;
  }, [initialCards, typeFilter, companyFilter, sortOrder, searchQuery]);

  return (
    <div className="w-full">
      {/* 상단 검색 및 필터 영역 */}
      <div className="mb-6">
        
        {/* 통합 검색창 */}
        <div className="relative mb-6">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="원하는 카드나 혜택을 검색해 보세요"
            className="w-full h-14 pl-12 pr-6 rounded-2xl border border-gray-200 focus:outline-none focus:border-[var(--action-primary)] focus:ring-1 focus:ring-[var(--action-primary)] shadow-sm text-lg placeholder-gray-400 bg-white transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
        </div>

        {/* 타입 토글 */}
        <div className="flex gap-1 sm:gap-2 mb-6 bg-gray-100 p-1.5 rounded-xl w-full sm:w-fit overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setTypeFilter('all')}
            className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${typeFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            전체카드
          </button>
          <button 
            onClick={() => setTypeFilter('신용카드')}
            className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${typeFilter === '신용카드' ? 'bg-white text-[var(--action-primary)] shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            신용카드
          </button>
          <button 
            onClick={() => setTypeFilter('체크카드')}
            className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${typeFilter === '체크카드' ? 'bg-white text-[var(--action-primary)] shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            체크카드
          </button>
        </div>

        <div className="flex flex-row justify-between items-center mb-4">
          
          {/* 카드사 필터 바텀시트 호출 버튼 (작은 위스의 박스 형태로 왼쪽에 위치) */}
          <button 
            onClick={() => setIsCompanySheetOpen(true)}
            className="flex items-center justify-between bg-gray-50 border border-gray-200 text-gray-700 font-medium py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors w-fit max-w-[55%] min-w-0"
          >
            <span className="truncate">{companyFilter === 'all' ? '모든 카드사' : companyFilter}</span>
            <ChevronDown className="w-4 h-4 text-gray-400 ml-1.5 shrink-0" />
          </button>

          {/* 정렬 방식 필터 바텀시트 호출 버튼 (박스 없이 텍스트 + 미니멀 화살표로 오른쪽에 위치) */}
          <button
            onClick={() => setIsSortSheetOpen(true)}
            className="flex items-center gap-1 text-gray-600 font-medium hover:text-gray-900 transition-colors"
          >
            <span>{
              sortOrder === 'popular' ? '인기순' :
              sortOrder === 'benefit' ? '혜택순' :
              sortOrder === 'issue' ? '전월발급순' :
              sortOrder === 'condition' ? '전월실적 낮은순' :
              sortOrder === 'fee' ? '연회비 낮은순' : '인기순'
            }</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* 카드 리스트 렌더링 영역 (미니멀) */}
      <div className="flex flex-col border-t border-gray-100">
        {filteredAndSortedCards.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 font-medium">조건에 맞는 카드가 없습니다.</p>
          </div>
        ) : (
          filteredAndSortedCards.map((card) => {
            const logoUrl = COMPANY_LOGOS[card.company];
            const displayImageUrl = (card.card_image_urls && card.card_image_urls.length > 0) ? card.card_image_urls[0] : card.card_image_url;
            
            return (
              <Link href={`/card/detail/${card.id}`} key={card.id}>
                <div className="flex flex-row items-center gap-5 py-5 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer group px-2">
                  
                  {/* 좌측: 카드 이미지 또는 로고 동그라미 */}
                  <div className={`w-14 h-14 md:w-16 md:h-16 shrink-0 flex justify-center items-center overflow-hidden ${displayImageUrl ? 'rounded-lg bg-transparent p-0' : 'bg-gray-100 border-0 rounded-full p-2'}`}>
                    {displayImageUrl ? (
                      <img src={displayImageUrl} alt={card.name} className="w-full h-full object-contain drop-shadow-sm" />
                    ) : logoUrl ? (
                      <img src={logoUrl} alt={card.company} className="w-full h-full object-contain mix-blend-multiply" />
                    ) : (
                      <span className="text-[9px] md:text-[10px] font-bold text-gray-400 text-center leading-tight break-keep">
                        {card.company.replace('카드', '')}
                      </span>
                    )}
                  </div>

                  {/* 중앙: 텍스트 미니멀 설명 및 부가 정보 */}
                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-400">{card.company}</span>
                      {card.promo && (
                        <span className="text-[10px] font-bold text-[var(--action-primary)] bg-pink-50 px-1.5 py-0.5 rounded-sm">
                          추천
                        </span>
                      )}
                    </div>
                    <h2 className="text-base md:text-lg font-bold text-gray-900 group-hover:text-[var(--action-primary)] transition-colors truncate">
                      {card.name}
                    </h2>
                    <p className="text-sm text-gray-500 truncate mt-0.5 mb-1.5">
                      {card.promo ? `${card.promo} • ` : ''}{card.benefits.slice(0, 3).map(b => typeof b === 'string' ? b : b?.title || '').join(' • ')}
                    </p>
                    
                    {/* 연회비 및 실적 (왼쪽으로 이동) */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center gap-1 text-xs text-gray-400 min-w-0">
                        <CreditCard className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{card.fees.split('/')[0]}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 min-w-0">
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{card.condition}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </Link>
            )
          })
        )}
      </div>

      {/* 카드사 선택 바텀시트 / 모달 (애니메이션 개선) */}
      <div 
        className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-all duration-300 ${isCompanySheetOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/40"
          onClick={() => setIsCompanySheetOpen(false)}
        />
        
        {/* Sheet / Modal Content */}
        <div 
          className={`relative w-full sm:w-[480px] bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-10 sm:pb-6 shadow-2xl transform transition-transform duration-300 ease-out ${isCompanySheetOpen ? 'translate-y-0 scale-100' : 'translate-y-full sm:translate-y-12 sm:scale-95'}`}
        >
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden" />
          
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">카드사 선택</h3>
            <button onClick={() => setIsCompanySheetOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* 데스크탑/모바일 모두 3열(3x3) 그리드 유지 */}
          <div className="grid grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pb-4 px-1">
            {companies.map(c => {
              const isSelected = companyFilter === c;
              const logoUrl = COMPANY_LOGOS[c];
              return (
                <button
                  key={c}
                  onClick={() => { 
                    // 선택된 카드사를 한 번 더 누르면 전체 보기('all')로 토글 해제
                    setCompanyFilter(isSelected ? 'all' : c); 
                    setIsCompanySheetOpen(false); 
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${isSelected ? 'border-2 border-[var(--action-primary)] bg-pink-50 shadow-sm' : 'border-0 bg-[#f4f5f7] hover:bg-gray-200'}`}
                >
                  <div className="w-10 h-10 mb-2 bg-white rounded-full shadow-sm flex items-center justify-center overflow-hidden p-1.5">
                    {logoUrl ? (
                      <img src={logoUrl} alt={c} className="w-full h-full object-contain mix-blend-multiply" />
                    ) : (
                      <span className="text-[9px] font-bold text-gray-400">{c.replace('카드','')}</span>
                    )}
                  </div>
                  <span className={`text-[11px] font-bold ${isSelected ? 'text-[var(--action-primary)]' : 'text-gray-600'} break-keep leading-tight`}>{c}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 정렬 방식 선택 바텀시트 / 모달 */}
      <div 
        className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-all duration-300 ${isSortSheetOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/40"
          onClick={() => setIsSortSheetOpen(false)}
        />
        
        {/* Sheet / Modal Content */}
        <div 
          className={`relative w-full sm:w-[400px] bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-10 sm:pb-6 shadow-2xl transform transition-transform duration-300 ease-out ${isSortSheetOpen ? 'translate-y-0 scale-100' : 'translate-y-full sm:translate-y-12 sm:scale-95'}`}
        >
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden" />
          
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">정렬 기준</h3>
            <button onClick={() => setIsSortSheetOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {[
              { id: 'popular', label: '인기순' },
              { id: 'benefit', label: '혜택순' },
              { id: 'issue', label: '전월발급순' },
              { id: 'condition', label: '전월실적 낮은순' },
              { id: 'fee', label: '연회비 낮은순' }
            ].map(option => (
              <button
                key={option.id}
                onClick={() => {
                  setSortOrder(option.id);
                  setIsSortSheetOpen(false);
                }}
                className={`flex items-center justify-between p-4 rounded-xl transition-colors ${sortOrder === option.id ? 'bg-pink-50 text-[var(--action-primary)] font-bold' : 'hover:bg-gray-50 text-gray-700 font-medium'}`}
              >
                <span>{option.label}</span>
                {sortOrder === option.id && (
                  <svg className="w-5 h-5 text-[var(--action-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
