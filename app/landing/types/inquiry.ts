// 문의 요청 데이터 타입
export interface InquiryRequest {
  referrerUrl?: string;
  phoneNumber: string;
  installLocation: string;
  installCount: number;
  privacyConsent: boolean;
  submittedAt?: string;
  marketerCode?: string | null;
}

// 확장된 문의 요청 타입 (설치 예약 지원)
export interface ExtendedInquiryRequest {
  referrerUrl?: string;
  phoneNumber: string;
  installLocation?: string;
  installCount?: number;
  privacyConsent: boolean;
  marketerCode?: string | null;
  // 새 필드
  inquiryType?: 'consultation' | 'installation' | 'as';
  reservationDate?: string;
  reservationTimeSlot?: 'morning' | 'afternoon';
}

// 문의 응답 데이터 타입
export interface InquiryResponse {
  phoneLastFour: string;
  installLocation: string;
  installCount: number;
  message: string;
}

// 폼 데이터 타입
export interface FormData {
  phoneNumber: string;
  installLocation: string;
  installCount: number;
  privacyConsent: boolean;
}

// Google Sheets 데이터 타입
export interface SheetsData {
  referrerUrl: string;
  phoneNumber: string;
  installLocation: string;
  installCount: number;
  submittedAt: string;
  privacyConsent: string; // 'Y' or 'N'
}
