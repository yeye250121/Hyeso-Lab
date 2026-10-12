import { unstable_cache } from 'next/cache';
import { supabase } from './supabase';

// 인터넷 가입 상품 데이터 접근 레이어.
// 상품은 통신사 × 속도 × 추가상품(TV 등) 조합 한 줄이 한 상품이다(82개 안팎).
// 전체를 한 번에 내려도 작아서, 메인 추천과 통신사 설정기가 같은 목록을 쓴다.
// 수수료 테이블은 여기서 절대 조인하지 않는다(service_role 전용).

export const INTERNET_CACHE_TAG = 'internet';

export type Carrier = {
  id: string;
  name: string;
  logo_url: string | null;
  product_note: string | null;
  business_only: boolean;
  display_order: number;
};

export type AddonType = 'none' | 'tv' | 'phone' | 'cctv';

export type InternetProduct = {
  id: string;
  carrier_id: string;
  internet_name: string;
  speed: string;
  speed_mbps: number;
  addon_type: AddonType;
  addon_name: string | null;
  monthly_fee: number;
  customer_gift: number | null;
  voucher: number | null;
  is_recommended: boolean;
  display_order: number;
};

const CARRIER_COLUMNS = 'id,name,logo_url,product_note,business_only,display_order';
const PRODUCT_COLUMNS =
  'id,carrier_id,internet_name,speed,speed_mbps,addon_type,addon_name,monthly_fee,customer_gift,voucher,is_recommended,display_order';

export const getCarriers = unstable_cache(
  async (): Promise<Carrier[]> => {
    const { data, error } = await supabase
      .from('internet_carriers')
      .select(CARRIER_COLUMNS)
      .order('display_order', { ascending: true });
    if (error) {
      console.error('Error fetching internet carriers:', error);
      return [];
    }
    return (data ?? []) as Carrier[];
  },
  ['internet-carriers'],
  { tags: [INTERNET_CACHE_TAG] }
);

export const getInternetProducts = unstable_cache(
  async (): Promise<InternetProduct[]> => {
    const { data, error } = await supabase
      .from('internet_products')
      .select(PRODUCT_COLUMNS)
      .order('display_order', { ascending: true });
    if (error) {
      console.error('Error fetching internet products:', error);
      return [];
    }
    return (data ?? []) as InternetProduct[];
  },
  ['internet-products'],
  { tags: [INTERNET_CACHE_TAG] }
);

export async function getCarrier(id: string): Promise<Carrier | null> {
  const carriers = await getCarriers();
  return carriers.find((c) => c.id === id) ?? null;
}

/** 속도 라벨 → 사람 말. 카드 부제에 쓴다 */
export function speedHint(mbps: number): string {
  if (mbps <= 100) return '1~2인 · 웹서핑, 영상 시청';
  if (mbps <= 200) return '2~3인 · 영상 시청';
  if (mbps <= 500) return '3~4인 · 게임, 여러 기기';
  return '재택근무 · 고화질 스트리밍';
}

/** 추가상품 라벨. 단독이면 '인터넷 단독' */
export function addonLabel(p: Pick<InternetProduct, 'addon_type' | 'addon_name'>): string {
  if (p.addon_type === 'none' || !p.addon_name) return '인터넷 단독';
  return p.addon_name.replace(/^TV/, 'TV ').replace(/\s{2,}/g, ' ').trim();
}

export function productTitle(carrierName: string, p: InternetProduct): string {
  return `${carrierName} · ${p.speed} · ${addonLabel(p)}`;
}

/** 사은품 문구. 값이 없으면 "상담 시 안내" */
export function giftLabel(p: Pick<InternetProduct, 'customer_gift'>): string {
  if (p.customer_gift == null) return '상담 시 안내';
  return `${(p.customer_gift / 10000).toLocaleString()}만원`;
}
