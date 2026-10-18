/**
 * 카카오 알림톡 템플릿 (솔라피 · 채널 @혜소)
 *
 * 템플릿 ID 는 비밀이 아니라 코드에 기본값을 두고, 재등록 시 환경변수로 덮어쓴다.
 * 변수는 솔라피 형식 '#{이름}' 그대로 넘긴다.
 */
export const ALIMTALK_TEMPLATES = {
  /**
   * 상담 신청 접수 안내 — 상담 신청 직후 고객에게.
   * 본문 변수 없음. 버튼 "신청서 작성하기" → https://www.hyeso.kr/c/#{token}
   */
  APPLICATION_LINK: process.env.SOLAPI_TEMPLATE_APPLICATION_LINK || 'KA01TP261018133349593y1oLGSYst83',
} as const

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
