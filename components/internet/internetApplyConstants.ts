import { AGREEMENTS, BANKS, CUSTOMER_TYPES, GIFT_RECEIVERS } from '@/components/electronics/applyConstants';

export { AGREEMENTS, BANKS, CUSTOMER_TYPES, GIFT_RECEIVERS };

export const PHONE_CARRIERS = ['SKT', 'KT', 'LG U+', '알뜰폰'] as const;
export const PAYERS = ['본인', '타인'] as const;

export const STEPS = ['상품', '연락처', '가입 정보', '사은품', '납부'] as const;

export type InternetApplyFormState = {
  // 1
  decideAfterConsult: boolean;
  productId: string | null;
  // 2
  applicantIsSelf: boolean;
  applicantName: string;
  phoneCarrier: (typeof PHONE_CARRIERS)[number] | '';
  phoneNumber: string;
  // 3
  customerType: (typeof CUSTOMER_TYPES)[number];
  businessName: string;
  businessNumber: string;
  currentInternet: 'none' | 'using' | null;
  currentCarrier: string;
  hasMobileBundle: boolean | null;
  zonecode: string;
  address: string;
  addressDetail: string;
  email: string;
  // 4
  giftSkipped: boolean;
  giftReceiver: string;
  giftBank: string;
  giftAccountNumber: string;
  // 5
  paymentSkipped: boolean;
  paymentPayer: (typeof PAYERS)[number] | null;
  paymentSameAsGift: boolean;
  paymentBank: string;
  paymentAccountNumber: string;
  // 6
  agreements: Record<string, boolean>;
  customerNote: string;
};

export const INITIAL_STATE: InternetApplyFormState = {
  decideAfterConsult: false,
  productId: null,
  applicantIsSelf: true,
  applicantName: '',
  phoneCarrier: '',
  phoneNumber: '',
  customerType: '개인',
  businessName: '',
  businessNumber: '',
  currentInternet: null,
  currentCarrier: '',
  hasMobileBundle: null,
  zonecode: '',
  address: '',
  addressDetail: '',
  email: '',
  giftSkipped: false,
  giftReceiver: '본인',
  giftBank: '',
  giftAccountNumber: '',
  paymentSkipped: false,
  paymentPayer: '본인',
  paymentSameAsGift: true,
  paymentBank: '',
  paymentAccountNumber: '',
  agreements: {},
  customerNote: '',
};

/** 123-45-67890 형태로 정규화 */
export function formatBusinessNumber(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}
export function isValidBusinessNumber(v: string): boolean {
  return /^\d{3}-\d{2}-\d{5}$/.test(v);
}
