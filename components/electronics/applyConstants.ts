export const CUSTOMER_TYPES = ['개인', '개인사업자', '법인사업자', '외국인'] as const;
export const GENDERS = ['남성', '여성'] as const;
export const CARRIERS = ['SKT', 'KT', 'LG U+', '알뜰폰'] as const;
export const PAYMENT_METHODS = ['은행 자동이체', '카드 결제'] as const;
export const GIFT_RECEIVERS = ['본인', '가족', '기타'] as const;

export const BANKS = [
  '국민은행',
  '신한은행',
  '우리은행',
  '하나은행',
  'NH농협은행',
  '기업은행',
  '카카오뱅크',
  '토스뱅크',
  '산업은행',
  'SC제일은행',
  '새마을금고',
  '신협',
  '우체국',
  '부산은행',
  '대구은행',
  '경남은행',
  '광주은행',
  '전북은행',
  '제주은행',
  '케이뱅크',
  'SBI저축은행',
  '수협은행',
] as const;

// 약관. 상세 본문은 아직 확정 전이라 링크 자리만 둔다.
export const AGREEMENTS = [
  { key: 'must_read', label: '필독사항', required: true },
  { key: 'terms', label: '이용약관', required: true },
  { key: 'unique_id', label: '고유식별정보 수집 및 처리 동의', required: true },
  { key: 'privacy', label: '개인정보 수집 및 활용 동의', required: true },
  { key: 'third_party', label: '개인정보 제3자 제공 및 활용 동의', required: true },
  { key: 'age14', label: '만 14세 이상입니다', required: true },
  { key: 'marketing', label: '마케팅 정보 수신 동의', required: false },
] as const;

export const STEPS = [
  '상품 선택',
  '가입자 정보',
  '설치 주소',
  '사은품 수령',
  '납부 방법',
  '약관 동의',
] as const;

export type ApplyFormState = {
  // 1
  decideAfterConsult: boolean;
  productSlug: string | null;
  planId: string | null;
  contractMonths: number | null;
  careType: string | null;
  // 2
  customerType: (typeof CUSTOMER_TYPES)[number];
  applicantName: string;
  birthDate: string;
  gender: (typeof GENDERS)[number] | null;
  carrier: string;
  phoneNumber: string;
  agentPhoneNumber: string;
  useAgentPhone: boolean;
  email: string;
  // 3
  zonecode: string;
  address: string;
  addressDetail: string;
  // 4
  giftReceiver: string;
  giftBank: string;
  giftAccountNumber: string;
  // 5
  paymentSkipped: boolean;
  paymentMethod: (typeof PAYMENT_METHODS)[number] | null;
  paymentSameAsGift: boolean;
  paymentBank: string;
  paymentAccountNumber: string;
  // 6
  agreements: Record<string, boolean>;
  customerNote: string;
};

export const INITIAL_STATE: ApplyFormState = {
  decideAfterConsult: false,
  productSlug: null,
  planId: null,
  contractMonths: null,
  careType: null,
  customerType: '개인',
  applicantName: '',
  birthDate: '',
  gender: null,
  carrier: '',
  phoneNumber: '',
  agentPhoneNumber: '',
  useAgentPhone: false,
  email: '',
  zonecode: '',
  address: '',
  addressDetail: '',
  giftReceiver: '본인',
  giftBank: '',
  giftAccountNumber: '',
  paymentSkipped: false,
  paymentMethod: '은행 자동이체',
  paymentSameAsGift: false,
  paymentBank: '',
  paymentAccountNumber: '',
  agreements: {},
  customerNote: '',
};

/** 010-1234-5678 형태로 정규화 */
export function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

/** YYYY-MM-DD 형태로 정규화 */
export function formatBirth(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  if (d.length < 5) return d;
  if (d.length < 7) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`;
}

export function isValidBirth(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return false;
  const year = Number(v.slice(0, 4));
  return year >= 1900 && d <= new Date();
}

export function isValidPhone(v: string): boolean {
  return /^01[016789]-\d{3,4}-\d{4}$/.test(v);
}

export function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

export function isValidAccount(v: string): boolean {
  const d = v.replace(/\D/g, '');
  return d.length >= 8 && d.length <= 16;
}
