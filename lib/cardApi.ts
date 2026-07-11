import fs from 'fs';
import path from 'path';

export interface CardData {
  id: string;
  promo: string;
  name: string;
  company: string;
  type: string;
  condition: string;
  benefits: string[];
  fees: string;
}

const dataFilePath = path.join(process.cwd(), 'data', 'cards.json');

// 전체 카드 목록 불러오기
export function getAllCards(): CardData[] {
  try {
    const fileContents = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(fileContents) as CardData[];
  } catch (error) {
    console.error("Error reading cards.json:", error);
    return [];
  }
}

// 특정 ID의 카드 상세 정보 불러오기
export function getCardById(id: string): CardData | undefined {
  const allCards = getAllCards();
  return allCards.find((card) => card.id === id);
}

// 카테고리별 카드 리스트 불러오기 (예: 전체, 신용카드, 체크카드, 특정 카드사 등)
export function getCardsByCategory(category: string): CardData[] {
  const allCards = getAllCards();
  
  if (category === 'all') return allCards;
  if (category === 'credit') return allCards.filter(c => c.type === '신용카드');
  if (category === 'check') return allCards.filter(c => c.type === '체크카드');
  
  // 회사명 기준 필터링 지원 (예: 'shinhan' -> '신한카드')
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
    return allCards.filter(c => c.company === companyMap[category]);
  }

  return allCards;
}
