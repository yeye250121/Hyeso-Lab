import { supabase } from './supabase';

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
}

// 전체 카드 목록 불러오기
export async function getAllCards(): Promise<CardData[]> {
  const { data, error } = await supabase.from('cards').select('*');
  if (error) {
    console.error('Error fetching cards:', error);
    return [];
  }
  return data as CardData[];
}

// 특정 ID의 카드 상세 정보 불러오기
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
export async function getCardsByCategory(category: string): Promise<CardData[]> {
  let query = supabase.from('cards').select('*');
  
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
  return data as CardData[];
}
