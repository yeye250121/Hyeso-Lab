// 상위 렌탈업체에 넘기는 명세서(텍스트). 카카오톡에 그대로 붙여넣을 수 있는 형태로 만든다.
// 담당자가 해피콜에서 다시 묻지 않도록 계좌·생년월일까지 싣는다 — 그래서 이 텍스트는
// 관리자 화면에서 명시적으로 요청했을 때만 만들고, 만든 사실을 서버 로그에 남긴다.

/** 고객에게 연락할 때 써 달라고 요청하는 상호. 담당자가 이 이름으로 전화한다. */
export const CONTACT_BRAND = '혜택연구소'

const SERVICE_LABEL: Record<string, string> = { card: '카드', internet: '인터넷', electronics: '가전렌탈' }

function kst(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}.${p(d.getUTCMonth() + 1)}.${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
}

function months(m: number | null | undefined): string | null {
  if (!m) return null
  return m % 12 === 0 ? `${m / 12}년 약정` : `${m}개월 약정`
}

/** 값이 있는 줄만 남긴다 */
function lines(rows: [string, unknown][]): string {
  return rows
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
}

function productLines(snap: Record<string, unknown>, contractMonths: number | null, careType: string | null) {
  if (!snap.displayName) return '상담 후 결정 (희망 상품 미정)'
  return lines([
    ['상품', `${snap.brand ?? ''} ${snap.displayName}`.trim()],
    ['모델코드', snap.modelCode],
    ['약정', months(contractMonths)],
    ['관리방법', careType],
    ['판매조건', snap.planVariant],
    ['예상 월 렌탈료', snap.monthlyFee ? `${Number(snap.monthlyFee).toLocaleString()}원 (접수 시점 정책표 기준)` : null],
  ])
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

/** 신청서(6단계) 기준 명세서 */
export function buildApplicationStatement(a: Row): string {
  const snap = (a.product_snapshot ?? {}) as Record<string, unknown>
  const rental =
    a.rental_status === '기존'
      ? `기존 사용 중${a.existing_rental_note ? ` — ${a.existing_rental_note}` : ''}`
      : a.rental_status === '신규'
        ? '신규'
        : '미확인 (해피콜에서 확인 필요)'

  const sameAccount = a.payment_same_as_gift && a.payment_method === '은행 자동이체'

  return [
    `[${CONTACT_BRAND} 렌탈 명세서]`,
    lines([
      ['접수번호', `A-${String(a.id).slice(0, 8).toUpperCase()}`],
      ['접수일시', kst(a.submitted_at)],
    ]),
    `※ 고객 연락 시 "${CONTACT_BRAND}" 상호로 안내 부탁드립니다.`,
    '',
    '■ 렌탈 이용 여부',
    rental,
    '',
    '■ 고객',
    lines([
      ['고객 구분', a.customer_type],
      ['가입자명', a.applicant_name],
      ['생년월일', a.birth_date],
      ['성별', a.gender],
      ['연락처', a.phone_number],
      ['대리인 연락처', a.agent_phone_number],
      ['이메일', a.email],
    ]),
    '',
    '■ 희망 상품',
    a.decide_after_consult ? '상담 후 결정 (희망 상품 미정)' : productLines(snap, a.contract_months, a.care_type),
    '',
    '■ 설치 주소',
    [a.zonecode && `(${a.zonecode})`, a.address, a.address_detail].filter(Boolean).join(' ') || '미입력',
    '',
    '■ 사은품 수령',
    lines([
      ['수령자', a.gift_receiver],
      ['은행', a.gift_bank],
      ['계좌번호', a.gift_account_number],
    ]) || '미입력',
    '',
    '■ 납부',
    a.payment_method
      ? lines([
          ['방식', a.payment_method],
          ['은행', a.payment_bank],
          ['계좌번호', a.payment_account_number],
          ['비고', sameAccount ? '사은품 수령 계좌와 동일' : null],
        ])
      : '나중에 결정 (해피콜에서 확인 필요)',
    ...(a.customer_note ? ['', '■ 고객 요청사항', a.customer_note] : []),
  ].join('\n')
}

/** 상담 신청(이름·전화번호만 받은 단계) 기준 명세서 */
export function buildLeadStatement(l: Row): string {
  const snap = (l.product_snapshot ?? {}) as Record<string, unknown>
  return [
    `[${CONTACT_BRAND} 상담 요청]`,
    lines([
      ['접수번호', `L-${String(l.id).slice(0, 8).toUpperCase()}`],
      ['접수일시', kst(l.submitted_at)],
      ['서비스', SERVICE_LABEL[l.service] ?? l.service],
    ]),
    `※ 고객 연락 시 "${CONTACT_BRAND}" 상호로 안내 부탁드립니다.`,
    '',
    '■ 고객',
    lines([
      ['이름', l.applicant_name || '미입력'],
      ['연락처', l.phone_number],
    ]),
    '',
    '■ 희망 상품',
    productLines(snap, l.contract_months, l.care_type),
    '',
    '※ 신청서 미작성 고객입니다. 렌탈 신규/기존 여부, 설치 주소 등은 통화로 확인 부탁드립니다.',
  ].join('\n')
}
