/**
 * 카카오 알림톡 템플릿 설정
 *
 * 변수 매핑: [*1*] → var1, [*2*] → var2, ...
 */

// 템플릿 코드 (뿌리오 심사 중 - 2025.12.30)
export const ALIMTALK_TEMPLATES = {
  // 파트너 회원가입 완료 - 본인에게 발송
  // [*1*] = 파트너 코드
  PARTNER_SIGNUP: 'ppur_2025123017483012849854361',

  // 하위 파트너 가입 - 상위 파트너에게 발송
  // [*1*] = 하위 파트너 닉네임
  PARTNER_REFERRAL_SIGNUP: 'ppur_2025123017520112849871250',

  // 정산 내역 도착 - 파트너에게 발송
  PARTNER_SETTLEMENT: 'ppur_2025123017591820835749782',

  // 새로운 상담 문의 - 파트너에게 발송
  PARTNER_NEW_INQUIRY: 'ppur_2025123017543820835166741',

  // 계약 성공 - 파트너에게 발송
  PARTNER_CONTRACT_SUCCESS: 'ppur_2025123017573512849260118',

  // 상담 취소 - 파트너에게 발송
  PARTNER_INQUIRY_CANCELLED: 'ppur_2025123018280120835265020',

  // ===== 고객용 알림톡 =====

  // 고객 문의 접수 완료 - 고객에게 발송
  // (변수 없음)
  CUSTOMER_INQUIRY_RECEIVED: 'ppur_2025123018060012849110430',

  // 고객 예약 안내 - 고객에게 발송 (바로 예약하기 버튼 포함)
  // (변수 없음, 버튼 URL: https://benefit-lab.kr/book)
  CUSTOMER_RESERVATION_GUIDE: 'ppur_2025123018083720835716306',
} as const

export type AlimtalkTemplateType = keyof typeof ALIMTALK_TEMPLATES

/**
 * 알림톡 발송 시나리오별 변수 매핑
 */
export interface AlimtalkVariables {
  var1?: string // [*1*]
  var2?: string // [*2*]
  var3?: string // [*3*]
  var4?: string // [*4*]
  var5?: string // [*5*]
}

/**
 * 파트너 회원가입 완료 알림톡 변수 생성
 * [*1*] = 파트너 코드
 */
export function getPartnerSignupVariables(partnerCode: string): AlimtalkVariables {
  return {
    var1: partnerCode,
  }
}

/**
 * 하위 파트너 가입 알림톡 변수 생성 (상위 파트너에게 발송)
 * [*1*] = 하위 파트너 닉네임
 */
export function getPartnerReferralSignupVariables(subordinateNickname: string): AlimtalkVariables {
  return {
    var1: subordinateNickname,
  }
}

/**
 * 정산 내역 도착 알림톡 변수 생성
 * (변수 없음)
 */
export function getPartnerSettlementVariables(): AlimtalkVariables {
  return {}
}

/**
 * 새로운 상담 문의 알림톡 변수 생성
 * (변수 없음)
 */
export function getPartnerNewInquiryVariables(): AlimtalkVariables {
  return {}
}

/**
 * 계약 성공 알림톡 변수 생성
 * (변수 없음)
 */
export function getPartnerContractSuccessVariables(): AlimtalkVariables {
  return {}
}

/**
 * 상담 취소 알림톡 변수 생성
 * (변수 없음)
 */
export function getPartnerInquiryCancelledVariables(): AlimtalkVariables {
  return {}
}

/**
 * 예약 페이지 URL 생성
 * @param inquiryId - 문의 UUID (선택)
 * @returns 예약 페이지 전체 URL
 */
export function getReservationUrl(inquiryId?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://benefit-lab.kr'
  if (inquiryId) {
    return `${baseUrl}/book/${inquiryId}`
  }
  return `${baseUrl}/book`
}
