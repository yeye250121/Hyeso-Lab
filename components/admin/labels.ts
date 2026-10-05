// 관리자 화면 공통 라벨·색.
export const SERVICE_LABEL: Record<string, string> = { card: '카드', internet: '인터넷', electronics: '가전렌탈' }

export const LEAD_STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: '신규', cls: 'bg-action-primary/10 text-action-primary' },
  contacted: { label: '연락완료', cls: 'bg-yellow-100 text-yellow-700' },
  applied: { label: '신청서작성', cls: 'bg-green-100 text-green-700' },
  closed: { label: '종료', cls: 'bg-gray-100 text-gray-500' },
}

export const APPLICATION_STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: '신규', cls: 'bg-action-primary/10 text-action-primary' },
  in_progress: { label: '진행중', cls: 'bg-yellow-100 text-yellow-700' },
  contracted: { label: '계약완료', cls: 'bg-green-100 text-green-700' },
  cancelled: { label: '취소', cls: 'bg-gray-100 text-gray-500' },
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}.${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export function monthsLabel(m: number | null): string {
  if (!m) return ''
  return m % 12 === 0 ? `${m / 12}년` : `${m}개월`
}
