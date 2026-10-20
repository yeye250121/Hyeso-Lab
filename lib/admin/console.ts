import type { AdminRole } from './auth'

// 역할별 콘솔. 주소 첫 조각(/owner, /admin, /marketer)이 콘솔이고, 메뉴와 권한은 역할이 정한다.
export type ConsoleName = 'owner' | 'admin' | 'marketer'
export const CONSOLES: ConsoleName[] = ['owner', 'admin', 'marketer']

export function consoleForRole(role: AdminRole): ConsoleName {
  return role === 'owner' ? 'owner' : role === 'marketer' ? 'marketer' : 'admin'
}

/** 콘솔 첫 화면 */
export function consoleHome(role: AdminRole): string {
  return role === 'marketer' ? '/marketer/home' : `/${consoleForRole(role)}/dashboard`
}

/** 외부 마케터가 열 수 있는 페이지(콘솔 아래 첫 조각) */
export const MARKETER_PAGES = ['home', 'link', 'leads', 'library', 'images', 'profile', 'chat']
/** 운영진(owner·admin) 전용이 아닌, 오너만 여는 페이지 */
export const OWNER_ONLY_PAGES = ['members']
/** 마케터 전용 페이지(운영진이 열면 대시보드로) */
export const MARKETER_ONLY_PAGES = ['home']

export function isPageAllowed(role: AdminRole, page: string): boolean {
  if (role === 'marketer') return MARKETER_PAGES.includes(page)
  if (MARKETER_ONLY_PAGES.includes(page)) return false
  if (role === 'admin' && OWNER_ONLY_PAGES.includes(page)) return false
  return true
}
