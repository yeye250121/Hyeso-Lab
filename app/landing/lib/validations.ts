import { z } from 'zod';

// 한국 전화번호 유효성 검사
const phonePatterns = [
  /^010\d{8}$/,              // 010-XXXX-XXXX
  /^01[016789]\d{7,8}$/,     // 011, 016, 017, 018, 019
  /^02\d{7,8}$/,             // 서울: 02-XXX-XXXX
  /^0[3-6][1-5]\d{6,7}$/,    // 지역: 031-XXX-XXXX
  /^0504\d{7}$/,             // 특수: 0504-XXX-XXXX
];

const validateKoreanPhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  return phonePatterns.some(pattern => pattern.test(cleanPhone));
};

// 기존 문의 폼 검증 스키마 (하위 호환성 유지)
export const inquiryFormSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, '전화번호를 입력해주세요')
    .refine(validateKoreanPhone, {
      message: '유효하지 않은 전화번호 형식입니다',
    }),
  installLocation: z
    .string()
    .min(2, '설치 지역을 최소 2자 이상 입력해주세요')
    .max(100, '설치 지역은 100자를 초과할 수 없습니다'),
  installCount: z
    .number()
    .int('설치 대수는 정수여야 합니다')
    .min(1, '설치 대수는 최소 1개입니다')
    .max(100, '설치 대수는 최대 100개입니다'),
  privacyConsent: z
    .boolean()
    .refine((val) => val === true, {
      message: '개인정보 처리방침에 동의해주세요',
    }),
});

// 기존 API 요청 스키마 (하위 호환성 유지)
export const inquiryRequestSchema = inquiryFormSchema.extend({
  referrerUrl: z.string().optional(),
  submittedAt: z.string().datetime().optional(),
  marketerCode: z.string().optional().nullable(),
});

// 새로운 통합 요청 스키마 (상담 신청 + 설치 예약)
export const reservationRequestSchema = z.object({
  // 공통 필드
  inquiryType: z.enum(['consultation', 'installation', 'as']),
  phoneNumber: z
    .string()
    .min(1, '전화번호를 입력해주세요')
    .refine(validateKoreanPhone, {
      message: '유효하지 않은 전화번호 형식입니다',
    }),
  privacyConsent: z
    .boolean()
    .refine((val) => val === true, {
      message: '개인정보 처리방침에 동의해주세요',
    }),
  referrerUrl: z.string().optional(),
  marketerCode: z.string().optional().nullable(),

  // 랜딩페이지 추적 필드
  landingTemplate: z.string().optional().default('kt-cctv'),
  landingSubtype: z.string().optional().default('1'),

  // 상담 신청 필드 (consultation 타입)
  installLocation: z.string().optional(),
  installCount: z.number().int().min(0).max(100).optional(),

  // 설치 예약 전용 필드 (installation 타입일 때만 필수)
  reservationDate: z.string().optional(), // YYYY-MM-DD
  reservationTimeSlot: z.enum(['morning', 'afternoon']).optional(),
  outdoorCount: z.number().int().min(0).max(99).optional(),
  indoorCount: z.number().int().min(0).max(99).optional(),
  address: z.string().optional(),
  addressDetail: z.string().optional(),
  zonecode: z.string().optional(),
  documents: z.record(z.string()).optional(),
  documentsSubmitted: z.boolean().optional(),
}).refine((data) => {
  // installation 타입일 때 필수 필드 검증
  if (data.inquiryType === 'installation') {
    return (
      data.reservationDate &&
      data.reservationTimeSlot &&
      data.address &&
      (data.outdoorCount !== undefined || data.indoorCount !== undefined)
    );
  }
  return true;
}, {
  message: '설치 예약에 필요한 정보를 모두 입력해주세요',
});

export type InquiryFormData = z.infer<typeof inquiryFormSchema>;
export type InquiryRequestData = z.infer<typeof inquiryRequestSchema>;
export type ReservationRequestData = z.infer<typeof reservationRequestSchema>;
