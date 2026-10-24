'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, ChevronDown, Loader2, Pause, Phone, Play } from 'lucide-react'
import { LEAD_AGREEMENTS, formatPhone, isValidPhone } from '@/components/shared/LeadForm'
import SuccessOverlay from '@/components/shared/SuccessOverlay'
import Footer from '@/components/shared/Footer'
import { pushMyLead } from '@/components/shared/localActivity'

// 파트너 랜딩. 약속 한 줄(차액 120% 보상) → 번호 폼 → 왜 가능한가(광고비 0) → 사은품 표 → 절차 → 조건 → 공통 푸터.
// 데스크톱에서도 모바일 폭(480px) 한 컬럼으로 보여준다. 추천인은 코드로만 잡고 화면엔 안 보인다.
// 토스식: 흰/연회색 섹션을 번갈아 쓰고, 큰 숫자는 120% 하나, 분홍 CTA 하나. 글자는 작고 무게는 가볍게.
export type LandingService = 'internet' | 'electronics'
type Carrier = { name: string; gift: number; voucher: number }
export type GiftCase = { name: string; region: string | null; product: string; amount: number; date: string }
type Catalog = { brands: string[]; categories: string[]; heroImages: string[]; productCount: number }

const LOGO = 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/public/HYESO-LAB/logos/hyeso.png'
const SERVICES: { key: LandingService; label: string; desc: string }[] = [
  { key: 'internet', label: '인터넷·TV', desc: 'KT · SK · LG U+' },
  { key: 'electronics', label: '가전렌탈', desc: '정수기 · 비데 · 공기청정기' },
]
const won = (n: number) => `${n.toLocaleString('ko-KR')}원`
const man = (n: number) => (n % 10000 === 0 ? `${n / 10000}만원` : won(n))

export default function PartnerLanding({
  code,
  initialService,
  maxGift,
  carriers,
  catalog,
  cases,
  sampleCases,
}: {
  code: string
  initialService: LandingService | null
  maxGift: number
  carriers: Carrier[]
  catalog: Catalog
  cases: GiftCase[]
  sampleCases: boolean
}) {
  const [service, setService] = useState<LandingService | null>(initialService)
  const [existing, setExisting] = useState<'new' | 'existing' | null>(null)
  const [phone, setPhone] = useState('')
  const [agreements, setAgreements] = useState<Record<string, boolean>>({})
  const [agreementsOpen, setAgreementsOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [doneId, setDoneId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)
  const [formInView, setFormInView] = useState(false)

  // 폼이 화면에 보이면 하단 고정 CTA 를 숨긴다
  useEffect(() => {
    const el = formRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setFormInView(e.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const allAgreed = LEAD_AGREEMENTS.every((a) => agreements[a.key])
  const requiredAgreed = LEAD_AGREEMENTS.filter((a) => a.required).every((a) => agreements[a.key])
  const canSubmit = !!service && !!existing && isValidPhone(phone) && requiredAgreed
  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {}
    for (const a of LEAD_AGREEMENTS) next[a.key] = checked
    setAgreements(next)
  }
  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const submit = async () => {
    setTouched(true)
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service,
          phoneNumber: phone,
          applicantName: '',
          agreedMarketing: !!agreements.marketing,
          referrerUrl: typeof window !== 'undefined' ? window.location.href : null,
          marketerCode: code,
          existingService: existing,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error ?? '신청 처리 중 문제가 생겼어요.')
      if (json.id && service) pushMyLead({ id: json.id, service, productName: null })
      setDoneId(json.id ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : '신청 처리 중 문제가 생겼어요.')
    } finally {
      setSubmitting(false)
    }
  }

  const done = doneId !== null
  const applicationHref = service === 'internet' ? `/internet/application?lead=${doneId}` : `/electronics/application?lead=${doneId}`
  const chip = (active: boolean) => `h-16 rounded-2xl text-left px-4 transition-colors ${active ? 'bg-[var(--action-primary)]/10 ring-[1.5px] ring-[var(--action-primary)]' : 'bg-[#f2f4f6] hover:bg-[#eceef1]'}`

  return (
    <div className="min-h-screen bg-[#f2f4f6] text-[#191f28]" data-testid="partner-landing">
      <div className="max-w-[480px] mx-auto min-h-screen bg-white md:shadow-[0_0_40px_rgba(0,0,0,0.06)]">
      {(submitting || done) && (
        <SuccessOverlay
          done={done}
          testId="landing-done"
          caption="접수 완료"
          title="혜택연구소 이름으로 전화드릴게요"
          description={
            <p>
              <span className="font-semibold text-[#333d4b]">{phone}</span> 로 한 번만 전화드려요.
              <br />
              카카오톡으로 신청서 링크도 보내드렸어요.
            </p>
          }
          actions={
            <>
              <Link href={applicationHref} data-testid="landing-done-application" className="inline-flex items-center justify-center h-[52px] rounded-xl bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-white font-semibold transition-colors">
                지금 바로 신청서 작성하기
              </Link>
              <Link href="/" className="inline-flex items-center justify-center h-[52px] rounded-xl bg-[#f2f4f6] hover:bg-[#eceef1] text-[#333d4b] font-semibold transition-colors">
                완료
              </Link>
            </>
          }
        />
      )}

      {/* 상단 띠: 약속 한 줄 */}
      <div className="sticky top-0 z-30 bg-[#fff1f5] text-center h-10 flex items-center justify-center text-[13px] font-medium text-[#ff5c8a]" data-testid="landing-topbar">
        타사보다 혜택이 적으면 차액 120% 보상
      </div>

      {/* 히어로 */}
      <section className="px-6 pt-10 pb-9 text-center">
        <Image src={LOGO} alt="혜택연구소" width={720} height={264} priority className="h-6 w-auto mx-auto" />
        <p className="mt-6 text-[16px] font-medium text-[#8b95a1]">혜소보다 더 주면</p>
        <p className="mt-1 leading-none">
          <span className="text-[18px] font-semibold text-[#333d4b] align-middle">차액의</span>{' '}
          <span className="text-[56px] font-bold tracking-[-0.03em] text-[var(--action-primary)] align-middle tabular-nums" data-testid="landing-120">120%</span>
        </p>
        <p className="mt-1 text-[20px] font-semibold text-[#333d4b] tracking-[-0.01em]">보상해드려요.</p>
        {maxGift > 0 && (
          <p className="mt-4 text-[14px] text-[#6b7684]">
            인터넷 최대 지원금 <span className="font-semibold text-[#333d4b]">{won(maxGift)}</span>
          </p>
        )}
        <button type="button" onClick={scrollToForm} className="mt-6 w-full h-[52px] rounded-2xl bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-white text-[16px] font-semibold transition-colors" data-testid="landing-cta-top">
          내 사은품 확인하기
        </button>
        <p className="mt-3 text-[12px] text-[#b0b8c1]">동일 상품 · 약정 · 관리 조건 기준</p>
      </section>

      {/* 왜 가능한가: 광고 모델을 쓰지 않는다 (연회색 섹션) */}
      <section className="bg-[#f9fafb] px-6 py-10" data-testid="landing-why">
        <p className="text-[12px] font-medium text-[var(--action-primary)]">어떻게 가능할까요?</p>
        <h2 className="mt-1.5 text-[22px] leading-[1.35] font-semibold tracking-[-0.02em] text-[#191f28]">
          광고 모델을 쓰지 않아요.
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-[#6b7684]">
          연예인 광고, TV 광고에 들어갈 돈을 <span className="text-[#333d4b] font-medium">전부 고객 지원금으로</span> 돌려드려요.
          <br />
          그래서 더 줄 수 있고, 더 주는 곳이 있으면 차액까지 얹어드려요.
        </p>

        <CompareChart />

        <p className="mt-5 text-[12px] leading-relaxed text-[#8b95a1]">월 요금은 어디서 가입해도 같아요. 다른 건 사은품뿐이에요.</p>
      </section>

      {/* 폼 */}
      <section ref={formRef} id="form" className="px-6 pt-10 pb-8 scroll-mt-10" data-testid="landing-form">
        <h2 className="text-[20px] font-semibold tracking-[-0.02em]">내 사은품 확인하기</h2>
        <p className="mt-1 text-[14px] text-[#8b95a1]">번호만 남겨주시면 전화드려요.</p>

        <p className="mt-6 text-[13px] font-medium text-[#6b7684]">어떤 혜택을 찾으세요?</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {SERVICES.map((s) => {
            const active = service === s.key
            return (
              <button key={s.key} type="button" onClick={() => setService(s.key)} data-testid={`landing-service-${s.key}`} className={chip(active)}>
                <span className={`block text-[15px] font-semibold ${active ? 'text-[var(--action-primary)]' : 'text-[#333d4b]'}`}>{s.label}</span>
                <span className="block mt-0.5 text-[12px] text-[#8b95a1]">{s.desc}</span>
              </button>
            )
          })}
        </div>

        <p className="mt-5 text-[13px] font-medium text-[#6b7684]">지금 쓰고 있는 게 있나요?</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(
            [
              ['new', '처음이에요', '신규 가입 혜택'],
              ['existing', '쓰는 중이에요', '약정 만료 · 이사 · 교체'],
            ] as const
          ).map(([k, label, desc]) => {
            const active = existing === k
            return (
              <button key={k} type="button" onClick={() => setExisting(k)} data-testid={`landing-existing-${k}`} className={chip(active)}>
                <span className={`block text-[15px] font-semibold ${active ? 'text-[var(--action-primary)]' : 'text-[#333d4b]'}`}>{label}</span>
                <span className="block mt-0.5 text-[12px] text-[#8b95a1]">{desc}</span>
              </button>
            )
          })}
        </div>

        <label className="block mt-5 text-[13px] font-medium text-[#6b7684]" htmlFor="landing-phone">휴대폰 번호</label>
        <input
          id="landing-phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          placeholder="010-0000-0000"
          data-testid="landing-phone"
          className={`mt-2 w-full h-[52px] px-4 rounded-2xl bg-[#f2f4f6] text-[16px] font-medium tracking-wide placeholder:font-normal placeholder:text-[#b0b8c1] focus:outline-none focus:ring-[1.5px] ${touched && !isValidPhone(phone) ? 'ring-[1.5px] ring-[#f04452]' : 'focus:ring-[var(--action-primary)]'}`}
        />

        {/* 동의 */}
        <div className="mt-3 rounded-2xl bg-[#f2f4f6] px-4 py-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center ${allAgreed ? 'bg-[var(--action-primary)] text-white' : 'bg-white text-[#d1d6db] border border-[#e5e8eb]'}`}>
                <Check className="w-3.5 h-3.5" strokeWidth={3} />
              </span>
              <input type="checkbox" className="sr-only" checked={allAgreed} onChange={(e) => toggleAll(e.target.checked)} data-testid="landing-agree-all" />
              <span className="text-[14px] font-medium">전체 동의</span>
            </label>
            <button type="button" onClick={() => setAgreementsOpen((v) => !v)} aria-expanded={agreementsOpen} className="p-1 text-[#8b95a1]">
              <ChevronDown className={`w-5 h-5 transition-transform ${agreementsOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
          {agreementsOpen && (
            <ul className="mt-3 pt-3 border-t border-[#e5e8eb] space-y-2.5">
              {LEAD_AGREEMENTS.map((a) => (
                <li key={a.key}>
                  <label className="flex items-center gap-2.5 cursor-pointer text-[13px] text-[#4e5968]">
                    <input type="checkbox" checked={!!agreements[a.key]} onChange={(e) => setAgreements({ ...agreements, [a.key]: e.target.checked })} className="w-4 h-4 accent-[var(--action-primary)]" />
                    <span>
                      <span className={a.required ? 'text-[#4e5968]' : 'text-[#8b95a1]'}>({a.required ? '필수' : '선택'})</span> {a.label}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        {touched && !canSubmit && <p className="mt-2 text-[13px] text-[#f04452]" data-testid="landing-error">{!service ? '찾는 혜택을 골라주세요.' : !existing ? '지금 쓰고 있는지 알려주세요.' : !isValidPhone(phone) ? '휴대폰 번호를 확인해주세요.' : '필수 약관에 동의해주세요.'}</p>}
        {error && <p className="mt-2 text-[13px] text-[#f04452]">{error}</p>}

        <button type="button" onClick={submit} disabled={submitting} data-testid="landing-submit" className={`mt-4 w-full h-[52px] rounded-2xl text-[16px] font-semibold text-white transition-colors flex items-center justify-center gap-2 ${canSubmit ? 'bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)]' : 'bg-[var(--action-primary)]/50'}`}>
          {submitting && <Loader2 className="w-5 h-5 animate-spin" />} 무료로 사은품 확인하기
        </button>
        <p className="mt-3 text-center text-[12px] text-[#b0b8c1]">가입 강요 없음 · 전화 한 번으로 끝 · 설치 후 현금 지급</p>
      </section>

      {/* 사은품 표 (연회색 섹션, 금액은 보일 때 뿅) */}
      {carriers.length > 0 && <GiftTable carriers={carriers} />}

      {/* 렌탈 가능한 가전 */}
      <RentalCatalog catalog={catalog} />

      {/* 지원금 지급 사례 (자동 롤링) */}
      {cases.length > 0 && <CaseTicker cases={cases} sample={sampleCases} />}

      {/* 절차 */}
      <section className="px-6 py-10">
        <h2 className="text-[18px] font-semibold tracking-[-0.02em]">이렇게 진행돼요</h2>
        <ol className="mt-4 space-y-2.5">
          {[
            ['번호를 남겨요', '이름도 필요 없어요. 번호 하나면 돼요.'],
            ['혜택연구소 이름으로 전화드려요', '조건 확인 후 사은품 금액을 먼저 확정해 드려요.'],
            ['설치 후 현금으로 받아요', '설치 확인되면 정해진 금액이 계좌로 들어가요.'],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3.5 rounded-2xl bg-[#f9fafb] px-4 py-4">
              <span className="w-6 h-6 shrink-0 rounded-full bg-[var(--action-primary)]/10 text-[var(--action-primary)] text-[12px] font-semibold flex items-center justify-center">{i + 1}</span>
              <div>
                <p className="text-[14px] font-medium text-[#333d4b]">{t}</p>
                <p className="mt-0.5 text-[13px] text-[#8b95a1]">{d}</p>
              </div>
            </li>
          ))}
        </ol>

        <details className="group mt-6 rounded-2xl bg-[#f9fafb] px-4" data-testid="landing-terms">
          <summary className="flex items-center justify-between h-13 py-3.5 cursor-pointer list-none text-[14px] font-medium text-[#333d4b]">
            120% 보상, 꼭 알아두세요
            <ChevronDown className="w-5 h-5 text-[#8b95a1] transition-transform group-open:rotate-180" />
          </summary>
          <ul className="pb-4 space-y-1.5 text-[13px] leading-relaxed text-[#6b7684] list-disc pl-4">
            <li>같은 통신사·상품·약정·관리 조건으로 비교해요.</li>
            <li>설치 전에 다른 곳의 견적(문자·카톡 캡처 등)을 보여주시면 차액의 120%를 사은품에 더해드려요.</li>
            <li>사은품은 설치 완료 후 지급돼요. 렌탈료·프로모션은 접수일 기준이에요.</li>
            <li>카드 할인 조건부 가격, 중복 불가 이벤트는 비교 대상이 아니에요.</li>
          </ul>
        </details>
      </section>

      {/* 공통 푸터 */}
      <div className="pb-24">
        <Footer compact />
      </div>
      </div>

      {/* 하단 고정 CTA (폼이 안 보일 때만) */}
      {!formInView && !done && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-30 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-white via-white/95 to-transparent">
          <div className="flex gap-2">
            <a href="tel:01074694385" aria-label="전화하기" className="w-[52px] h-[52px] shrink-0 rounded-2xl bg-[#f2f4f6] flex items-center justify-center text-[#333d4b]">
              <Phone className="w-5 h-5" />
            </a>
            <button type="button" onClick={scrollToForm} data-testid="landing-cta-sticky" className="flex-1 h-[52px] rounded-2xl bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-white text-[16px] font-semibold shadow-[0_8px_24px_rgba(255,143,171,0.3)] transition-colors">
              내 사은품 확인하기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// 광고비·마진 vs 지원금 비교 그래프. 화면에 들어오면 막대가 아래에서 자라고, 120% 배지가 떠오른다.
function CompareChart() {
  const ref = useRef<HTMLDivElement>(null)
  const [grow, setGrow] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setGrow(true); io.disconnect() } }, { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const seg = (h: number, cls: string, label: string, delay: number) => (
    <div className={`${grow ? 'landing-grow' : 'scale-y-0'} w-full rounded-[10px] flex items-center justify-center text-[12px] ${cls}`} style={{ height: h, animationDelay: `${delay}ms` }}>
      <span className={`${grow ? 'landing-fade' : 'opacity-0'}`} style={{ animationDelay: `${delay + 350}ms` }}>{label}</span>
    </div>
  )
  return (
    <div ref={ref} className="mt-7 rounded-[20px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]" data-testid="landing-chart" data-grown={grow ? '1' : '0'}>
      <div className="grid grid-cols-2 gap-5 items-end h-[196px]">
        {/* 다른 곳: 광고비·마진이 위를 차지하고 지원금은 아래 조금 */}
        <div className="flex flex-col justify-end gap-1 h-full">
          {seg(52, 'bg-[#f2f4f6] text-[#b0b8c1]', '광고비', 0)}
          {seg(36, 'bg-[#f2f4f6] text-[#b0b8c1]', '중간 마진', 80)}
          {seg(64, 'bg-[#d1d6db] text-[#4e5968] font-medium', '지원금', 160)}
        </div>
        {/* 혜택연구소: 전부 지원금 + 보상 배지 */}
        <div className="relative flex flex-col justify-end gap-1 h-full">
          <div className={`${grow ? 'landing-pop landing-float' : 'opacity-0'} absolute -top-1 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 h-7 rounded-full bg-[#191f28] text-white text-[11px] font-semibold flex items-center gap-1 shadow-md`} style={{ animationDelay: '700ms, 1200ms' }}>
            <span className="text-[var(--action-primary)]">+</span> 차액 × 120%
            <span className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 rotate-45 bg-[#191f28]" />
          </div>
          {seg(152, 'bg-gradient-to-t from-[#ff7096] to-[#ff9fb8] text-white font-semibold text-[13px] shadow-[0_8px_20px_rgba(255,143,171,0.35)]', '지원금', 240)}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-5 text-center text-[12px]">
        <span className="text-[#8b95a1]">다른 곳</span>
        <span className="text-[#333d4b] font-medium">혜택연구소</span>
      </div>
      <div className="mt-4 pt-3 border-t border-[#f2f4f6] flex items-center justify-center gap-4 text-[11px] text-[#8b95a1]">
        <span className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-[3px] bg-[#f2f4f6] border border-[#e5e8eb]" /> 광고비 · 마진</span>
        <span className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-[3px] bg-[#d1d6db]" /> 지원금</span>
        <span className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-[3px] bg-[var(--action-primary)]" /> 혜택연구소 지원금</span>
      </div>
    </div>
  )
}

// 통신사별 최대 지원금. 줄마다 "확인하기" 를 누르면 금액이 뿅 하고 나타난다(반짝이 6개와 함께).
const SPARKS = [
  { x: -18, y: -14 }, { x: 16, y: -16 }, { x: 22, y: 4 }, { x: -22, y: 6 }, { x: 6, y: 18 }, { x: -8, y: 16 },
]
function GiftTable({ carriers }: { carriers: Carrier[] }) {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})
  const allRevealed = carriers.every((_, i) => revealed[i])

  return (
    <section className="bg-[#f9fafb] px-6 py-10" data-testid="landing-gifts">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-semibold tracking-[-0.02em]">통신사별 최대 지원금</h2>
          <p className="mt-1 text-[13px] text-[#8b95a1]">눌러서 확인해 보세요. 지금 정책표 기준이에요.</p>
        </div>
        {!allRevealed && (
          <button type="button" onClick={() => setRevealed(Object.fromEntries(carriers.map((_, i) => [i, true])))} className="shrink-0 text-[12px] font-medium text-[#8b95a1] underline underline-offset-2" data-testid="landing-gift-reveal-all">
            전부 보기
          </button>
        )}
      </div>
      <ul className="mt-4 rounded-2xl bg-white divide-y divide-[#f2f4f6] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        {carriers.map((c, i) => (
          <li key={c.name} className="flex items-center justify-between px-4 h-[52px]">
            <span className="text-[14px] font-medium text-[#333d4b]">{c.name}</span>
            <span className="relative inline-flex items-baseline gap-1 justify-end">
              {revealed[i] ? (
                <>
                  {SPARKS.map((s, j) => (
                    <i
                      key={j}
                      aria-hidden
                      className="landing-spark absolute right-6 top-1/2 w-1.5 h-1.5 rounded-full bg-[var(--action-primary)]"
                      style={{ ['--sx' as string]: `${s.x}px`, ['--sy' as string]: `${s.y}px`, animationDelay: '80ms' }}
                    />
                  ))}
                  <span className="landing-pop text-[15px] font-semibold tabular-nums text-[#191f28]" data-testid="landing-gift-amount">
                    {man(c.gift)}
                  </span>
                  {c.voucher > 0 && (
                    <span className="landing-pop text-[11px] font-medium text-[#8b95a1]" style={{ animationDelay: '120ms' }}>
                      + 상품권 {man(c.voucher)}
                    </span>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setRevealed((r) => ({ ...r, [i]: true }))}
                  data-testid="landing-gift-reveal"
                  className="h-8 px-3.5 rounded-full bg-[#fff1f5] text-[13px] font-semibold text-[var(--action-primary)] active:scale-95 transition-transform"
                >
                  확인하기
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[12px] text-[#b0b8c1]">가전렌탈은 제품·약정마다 달라 상담 때 금액을 먼저 확정해 알려드려요.</p>
    </section>
  )
}

// 어떤 가전을 렌탈할 수 있는지: 대표 사진 3장 → 브랜드 격자 → 품목 두 줄(접기/펼치기)
function RentalCatalog({ catalog }: { catalog: Catalog }) {
  const [open, setOpen] = useState(false)
  const visible = open ? catalog.categories : catalog.categories.slice(0, 8)
  return (
    <section className="px-6 py-10" data-testid="landing-catalog">
      <h2 className="text-[18px] font-semibold tracking-[-0.02em]">어떤 가전을 렌탈할 수 있나요?</h2>
      <p className="mt-1 text-[13px] text-[#8b95a1]">정수기부터 생활가전까지, {catalog.productCount}종을 비교해요.</p>
      {catalog.heroImages.length > 0 && (
        <div className="mt-5 flex items-end justify-center gap-4">
          {catalog.heroImages.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt="" loading="lazy" className="h-[112px] w-[96px] object-contain" />
          ))}
        </div>
      )}
      {catalog.brands.length > 0 && (
        <>
          <p className="mt-7 text-[14px] font-medium text-[#333d4b]">함께하는 브랜드</p>
          <ul className="mt-2.5 grid grid-cols-4 gap-y-3 rounded-2xl bg-[#f9fafb] px-3 py-4 text-center" data-testid="landing-brands">
            {catalog.brands.map((b) => (
              <li key={b} className="text-[13px] font-medium text-[#4e5968]">{b}</li>
            ))}
          </ul>
        </>
      )}
      {catalog.categories.length > 0 && (
        <>
          <p className="mt-7 text-[14px] font-medium text-[#333d4b]">이런 품목을 상담할 수 있어요</p>
          <ul className="mt-2.5 grid grid-cols-2 gap-y-2.5 gap-x-4" data-testid="landing-categories">
            {visible.map((c) => (
              <li key={c} className="flex items-center gap-1.5 text-[13px] text-[#4e5968]">
                <span className="w-1 h-1 rounded-full bg-[#b0b8c1]" /> {c}
              </li>
            ))}
          </ul>
          {catalog.categories.length > 8 && (
            <button type="button" onClick={() => setOpen((v) => !v)} className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-[var(--action-primary)]" data-testid="landing-categories-toggle">
              {open ? '접기' : '전체 품목 보기'} <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
          )}
        </>
      )}
    </section>
  )
}

// 지원금 지급 사례. 카드가 옆으로 계속 흐르고(모요 후기처럼), 멈춤 버튼과 손가락 터치로 멈춘다.
function CaseTicker({ cases, sample }: { cases: GiftCase[]; sample: boolean }) {
  const [paused, setPaused] = useState(false)
  const [started, setStarted] = useState(false) // 화면에 들어온 뒤부터 흐른다(처음 카드가 잘려 보이지 않게)
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStarted(true); io.disconnect() } }, { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const items = [...cases, ...cases] // 절반 이동으로 끊김 없이 이어진다
  return (
    <section ref={ref} className="bg-[#f9fafb] py-10 overflow-hidden" data-testid="landing-cases">
      <div className="px-6 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-semibold tracking-[-0.02em]">지원금 지급 사례</h2>
          <p className="mt-1 text-[13px] text-[#8b95a1]">설치 확인 후 계좌로 들어간 금액이에요.{sample ? ' (예시)' : ''}</p>
        </div>
        <button type="button" onClick={() => setPaused((v) => !v)} className="shrink-0 inline-flex items-center gap-1 text-[12px] text-[#8b95a1]" data-testid="landing-cases-toggle">
          {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />} {paused ? '자동 넘김' : '자동 넘김 멈춤'}
        </button>
      </div>
      <div className="mt-5" onTouchStart={() => setPaused(true)} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <ul className={`flex gap-3 w-max pl-6 ${started ? 'landing-marquee' : ''} ${paused ? 'is-paused' : ''}`} style={{ ['--marquee-duration' as string]: `${cases.length * 6}s` }}>
          {items.map((c, i) => (
            <li key={i} className="w-[220px] shrink-0 rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]" data-testid="landing-case">
              <p className="text-[12px] text-[#8b95a1]">{c.name}{c.region ? ` · ${c.region}` : ''}</p>
              <p className="mt-1 text-[14px] font-medium text-[#333d4b] truncate">{c.product}</p>
              <p className="mt-2.5 text-[18px] font-semibold tabular-nums text-[var(--action-primary)]">{c.amount.toLocaleString('ko-KR')}원</p>
              <p className="mt-0.5 text-[11px] text-[#b0b8c1]">{c.date ? `${c.date.replace(/-/g, '.')} 지급` : '설치 후 지급'}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
