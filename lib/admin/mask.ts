// 관리자 화면에서 민감정보를 기본으로 가려서 내려보낼 때 쓴다.
// 전체 값은 상세 조회에서 명시적으로 요청(reveal)했을 때만 내려간다.

/** 12345678901 → *******8901 */
export function maskAccount(v: string | null): string | null {
  if (!v) return v
  const d = v.replace(/\s/g, '')
  return d.length <= 4 ? '*'.repeat(d.length) : '*'.repeat(d.length - 4) + d.slice(-4)
}

/** 1990-01-01 → 1990-**-** */
export function maskBirth(v: string | null): string | null {
  return v ? `${v.slice(0, 4)}-**-**` : v
}
