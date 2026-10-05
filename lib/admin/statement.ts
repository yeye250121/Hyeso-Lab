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

/** 우리가 받지 않는 항목. 담당자가 해피콜에서 확인한다 */
const ASK = '(해피콜 확인)'

/**
 * 신청서(6단계) 기준 명세서.
 * 항목 이름과 순서는 상위 업체의 접수 양식(성함 → 주민번호 → 설치주소 → … → 해피콜가능시간)을
 * 그대로 따른다 — 담당자가 자기 양식에 옮겨 적지 않고 바로 쓸 수 있게 하려는 것이다.
 * 양식에는 있지만 우리가 받지 않는 값(납부일·색상·설치희망일 등)은 "(해피콜 확인)" 으로 둔다.
 */
export function buildApplicationStatement(a: Row): string {
  const snap = (a.product_snapshot ?? {}) as Record<string, unknown>
  const hasProduct = !a.decide_after_consult && !!snap.displayName
  const rental =
    a.rental_status === '기존'
      ? `기존 사용 중${a.existing_rental_note ? ` — ${a.existing_rental_note}` : ''}`
      : a.rental_status === '신규'
        ? '신규'
        : ASK

  const account = (bank: unknown, no: unknown) => (bank || no ? [bank, no].filter(Boolean).join(' ') : null)
  const payment = a.payment_method
    ? [account(a.payment_bank, a.payment_account_number), `(${a.payment_method})`].filter(Boolean).join(' ')
    : ASK
  const giftAccount = account(a.gift_bank, a.gift_account_number)
  const isWaterPurifier = snap.categorySlug === 'water-purifier'

  const rows: [string, unknown][] = [
    ['성함', a.applicant_name],
    ['주민번호', a.birth_date ? `${a.birth_date}${a.gender ? ` (${a.gender})` : ''} ※ 생년월일만 받음` : ASK],
    ['설치주소', [a.zonecode && `(${a.zonecode})`, a.address, a.address_detail].filter(Boolean).join(' ') || ASK],
    ['납부계좌', payment],
    ['납부일', ASK],
    ['연락처', [a.phone_number, a.agent_phone_number && `대리인 ${a.agent_phone_number}`].filter(Boolean).join(' / ')],
    ['이메일', a.email || '없음'],
    ['상품', hasProduct ? `${snap.brand ?? ''} ${snap.displayName}`.trim() : '상담 후 결정'],
    ['모델명', hasProduct ? snap.modelCode : ASK],
    ['색상', ASK],
    ['프로모션', hasProduct ? snap.planVariant || ASK : ASK],
    ['월요금', hasProduct && snap.monthlyFee ? `${Number(snap.monthlyFee).toLocaleString()}원 (접수 시점 정책표 기준)` : ASK],
    ['약정기간', months(a.contract_months) ?? ASK],
    ['관리주기', a.care_type || ASK],
    ...(isWaterPurifier || !hasProduct ? ([['조리수설치유/무', ASK]] as [string, unknown][]) : []),
    ['사은품', '(협의 후 안내)'],
    ['사은품 받을 계좌', giftAccount ? `${giftAccount}${a.gift_receiver ? ` (${a.gift_receiver})` : ''}` : ASK],
    ['설치희망일자', ASK],
    ['해피콜가능시간', ASK],
  ]

  return [
    `[${CONTACT_BRAND} 렌탈 접수 명세서]`,
    lines([
      ['접수번호', `A-${String(a.id).slice(0, 8).toUpperCase()}`],
      ['접수일시', kst(a.submitted_at)],
      ['고객 구분', a.customer_type],
      ['렌탈 이용', rental],
    ]),
    `※ 고객 연락 시 "${CONTACT_BRAND}" 상호로 안내 부탁드립니다.`,
    '',
    rows.map(([k, v]) => `${k} : ${v ?? ''}`).join('\n'),
    ...(a.customer_note ? ['', `고객 요청사항 : ${a.customer_note}`] : []),
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
