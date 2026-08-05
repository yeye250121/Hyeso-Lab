import { unstable_cache } from 'next/cache';
import { supabase } from './supabase';

// 카드 데이터 캐시 태그. 관리자가 카드를 저장하면
// app/admin/cards/actions.ts 에서 revalidateTag 로 무효화한다.
export const CARDS_CACHE_TAG = 'cards';

export interface CardData {
  id: string;
  promo: string;
  name: string;
  company: string;
  type: string;
  condition: string;
  benefits: any[]; // 혜택 요약 (문자열 또는 객체 배열)
  main_benefits?: { // 주요 혜택 (상세 내용 포함)
    category: string;
    title: string;
    content: string;
  }[];
  fees: string;
  card_image_url?: string;
  card_image_urls?: string[];
  detailed_benefits?: string;
  official_product_url?: string;
  official_product_url_verified_at?: string;
}

// 목록/홈에서 쓰는 경량 타입. main_benefits(전체 응답의 85%)를 제외한다.
export type CardListItem = Pick<
  CardData,
  | 'id'
  | 'promo'
  | 'name'
  | 'company'
  | 'type'
  | 'condition'
  | 'benefits'
  | 'fees'
  | 'card_image_url'
  | 'card_image_urls'
>;

// 관리자 목록 테이블에서 실제로 렌더링하는 컬럼만.
export type AdminCardListItem = Pick<
  CardData,
  'id' | 'name' | 'company' | 'type' | 'detailed_benefits' | 'card_image_url'
>;

const LIST_COLUMNS =
  'id,promo,name,company,type,condition,benefits,fees,card_image_url,card_image_urls';

const ADMIN_LIST_COLUMNS =
  'id,name,company,type,detailed_benefits,card_image_url';

// 카드 목록용 조회 (main_benefits 제외).
// 목록 페이지는 searchParams 를 읽어 동적 렌더링되므로, 매 요청마다
// Supabase 를 왕복하지 않도록 데이터 자체를 캐시한다.
export const getCardsForList = unstable_cache(
  async (): Promise<CardListItem[]> => {
    const { data, error } = await supabase.from('cards').select(LIST_COLUMNS);
    if (error) {
      console.error('Error fetching cards:', error);
      return [];
    }
    return (data ?? []) as CardListItem[];
  },
  ['cards-list'],
  { revalidate: 3600, tags: [CARDS_CACHE_TAG] }
);

// 이름으로 특정 카드들만 조회 (카드 홈의 큐레이션 섹션용)
export async function getCardsByNames(names: string[]): Promise<CardListItem[]> {
  if (names.length === 0) return [];

  const { data, error } = await supabase
    .from('cards')
    .select(LIST_COLUMNS)
    .in('name', names);

  if (error) {
    console.error('Error fetching cards by name:', error);
    return [];
  }
  return (data ?? []) as CardListItem[];
}

// generateStaticParams 전용. id 컬럼만 필요하다.
export async function getAllCardIds(): Promise<string[]> {
  const { data, error } = await supabase.from('cards').select('id');
  if (error) {
    console.error('Error fetching card ids:', error);
    return [];
  }
  return (data ?? []).map((row) => row.id as string);
}

// 관리자 카드 목록용 조회
export async function getCardsForAdmin(): Promise<AdminCardListItem[]> {
  const { data, error } = await supabase
    .from('cards')
    .select(ADMIN_LIST_COLUMNS);
  if (error) {
    console.error('Error fetching cards for admin:', error);
    return [];
  }
  return (data ?? []) as AdminCardListItem[];
}

// 특정 ID의 카드 상세 정보 불러오기 (상세 페이지만 전체 컬럼을 쓴다)
export async function getCardById(id: string): Promise<CardData | undefined> {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching card ${id}:`, error);
    return undefined;
  }
  return data as CardData;
}

// 카테고리별 카드 리스트 불러오기 (예: 전체, 신용카드, 체크카드, 특정 카드사 등)
export async function getCardsByCategory(category: string): Promise<CardListItem[]> {
  let query = supabase.from('cards').select(LIST_COLUMNS);

  if (category !== 'all') {
    if (category === 'credit') {
      query = query.eq('type', '신용카드');
    } else if (category === 'check') {
      query = query.eq('type', '체크카드');
    } else {
      const companyMap: Record<string, string> = {
        'shinhan': '신한카드',
        'hyundai': '현대카드',
        'lotte': '롯데카드',
        'samsung': '삼성카드',
        'hana': '하나카드',
        'kb': 'KB국민카드',
        'bc': 'BC바로카드',
        'woori': '우리카드',
        'nh': 'NH농협카드'
      };
      if (companyMap[category]) {
        query = query.eq('company', companyMap[category]);
      }
    }
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching cards by category:', error);
    return [];
  }
  return (data ?? []) as CardListItem[];
}
