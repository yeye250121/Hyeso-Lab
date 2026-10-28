import type { GiftCase } from '@/components/landing/PartnerLanding'

// 메인 지급 사례. 사업자가 직접 추가한다(실제 지급 건만). DB 의 계약완료+사은품 건과 합쳐 보여주고,
// 둘 다 비어 있으면 메인에서는 섹션을 숨긴다. (파트너 랜딩의 예시 카드는 별도 — app/m/[code]/page.tsx)
export const MANUAL_GIFT_CASES: GiftCase[] = []
