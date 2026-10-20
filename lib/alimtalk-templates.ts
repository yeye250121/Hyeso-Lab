/**
 * 카카오 알림톡 템플릿 (솔라피 · 채널 @혜소)
 *
 * 템플릿 ID 는 비밀이 아니라 코드에 기본값을 두고, 재등록 시 환경변수로 덮어쓴다.
 * 변수는 솔라피 형식 '#{이름}' 그대로 넘긴다.
 */
export const ALIMTALK_TEMPLATES = {
  /**
   * 상담 신청 접수 안내 — 상담 신청 직후 고객에게. 강조표기형(제목 "상담 신청이 접수됐어요").
   * 본문 변수 없음. 버튼 "신청서 작성하기" → https://www.hyeso.kr/c/#{token}
   * 기본형 버전(KA01TP261018133349593y1oLGSYst83)도 검수 중이라, 통과한 쪽을 환경변수로 고를 수 있다.
   */
  APPLICATION_LINK: process.env.SOLAPI_TEMPLATE_APPLICATION_LINK || 'KA01TP2610201317516663CD1v7cEbHC',
  /** 관리자 새 상담 신청 알림 — 변수 서비스/고객명/상품/접수시각, 버튼은 관리자 페이지 고정 링크 */
  ADMIN_NEW_LEAD: process.env.SOLAPI_TEMPLATE_ADMIN_NEW_LEAD || 'KA01TP261020141539331S6vKh3MM46V',
  /** 담당자 접수 명세서 전달 — 변수 접수번호/고객명/상품/렌탈이용/사은품/token, 버튼 → /s/#{token} */
  VENDOR_STATEMENT: process.env.SOLAPI_TEMPLATE_VENDOR_STATEMENT || 'KA01TP261020141539494bQl5PBfFHIf',
  /** 파트너스 가입 신청 접수 — 변수 이름 */
  PARTNER_SIGNUP_RECEIVED: process.env.SOLAPI_TEMPLATE_PARTNER_SIGNUP || 'KA01TP26102017303576427EPV7mq5PH',
  /** 파트너스 가입 승인 완료(강조형, 변수 없음) — 버튼 "시작하기" → 로그인 */
  PARTNER_APPROVED: process.env.SOLAPI_TEMPLATE_PARTNER_APPROVED || 'KA01TP261020173843644HetCzIjStfg',
  /** 파트너스 새 상담 문의(강조형) — 버튼 → /partners/leads */
  PARTNER_NEW_LEAD: process.env.SOLAPI_TEMPLATE_PARTNER_NEW_LEAD || 'KA01TP261020173843791XGK5UqyQDBb',
  /** 파트너스 계약 성공(강조형) — 버튼 → /partners/home */
  PARTNER_CONTRACT: process.env.SOLAPI_TEMPLATE_PARTNER_CONTRACT || 'KA01TP261020173843918J7xqg1Cko2o',
  /** 파트너스 상담 취소(강조형) — 버튼 → /partners/leads */
  PARTNER_CANCELLED: process.env.SOLAPI_TEMPLATE_PARTNER_CANCELLED || 'KA01TP2610201738440150jzyrAoKuPR',
} as const

/** 협력업체 담당자(접수 대행) 알림톡 수신 번호. 서비스 공통 1명 */
export const VENDOR_ALIMTALK_PHONE = process.env.VENDOR_ALIMTALK_PHONE || ''

/** 담당자 전용 명세서 링크 */
export function statementLinkFor(token: string): string {
  return `${SITE_BASE_URL}/s/${token}`
}

export type AlimtalkTemplateKey = keyof typeof ALIMTALK_TEMPLATES

export const SITE_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.hyeso.kr'

/** 서비스별 셀프 신청서 경로. 상담 신청 id 가 붙으면 이름·전화번호·상품이 미리 채워진다 */
export function applicationPathFor(service: string, leadId: string): string {
  if (service === 'electronics') return `/electronics/application?lead=${leadId}`
  if (service === 'internet') return `/internet/application?lead=${leadId}`
  return `/apply?service=${service}`
}

/** 알림톡 버튼이 여는 짧은 링크 */
export function shortLinkFor(token: string): string {
  return `${SITE_BASE_URL}/c/${token}`
}
