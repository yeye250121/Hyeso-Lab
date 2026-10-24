'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, ChevronDown, Loader2, Phone } from 'lucide-react'
import { LEAD_AGREEMENTS, formatPhone, isValidPhone } from '@/components/shared/LeadForm'
import SuccessOverlay from '@/components/shared/SuccessOverlay'
import { pushMyLead } from '@/components/shared/localActivity'

// 파트너 랜딩. 한 가지 약속(차액 120% 보상) → 번호 폼 → 왜 가능한가(광고비 0) → 사은품 표 → 절차 → 조건.
// 토스식: 흰 바탕, 큰 숫자 하나, 회색(#f2f4f6) 면, 분홍 CTA 하나.
export type LandingService = 'internet' | 'electronics'
type Carrier = { name: string; gift: number; voucher: number }

const LOGO = 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/public/HYESO-LAB/logos/hyeso-mark.png'
const SERVICES: { key: LandingService; label: string; desc: string }[] = [
  { key: 'internet', label: '인터넷·TV', desc: 'KT · SK · LG U+' },
  { key: 'electronics', label: '가전렌탈', desc: '정수기 · 비데 · 공기청정기' },
]
const won = (n: number) => `${n.toLocaleString('ko-KR')}원`
const man = (n: number) => (n % 10000 === 0 ? `${n / 10000}만원` : won(n))

export default function PartnerLanding({
  code,
  partner,
  initialService,
  maxGift,
  carriers,
}: {
  code: string
  partner: { nickname: string; avatarUrl: string | null }
  initialService: LandingService | null
  maxGift: number
  carriers: Carrier[]
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

  return (
    <div className="min-h-screen bg-white text-[#191f28]" data-testid="partner-landing">
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

      <div className="max-w-[560px] mx-auto">
        {/* 파트너 띠 */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-[#f2f4f6]">
          <div className="h-14 px-5 flex items-center gap-2.5">
            <Image src={LOGO} alt="" width={28} height={28} className="w-7 h-7" />
            <span className="text-[15px] font-bold tracking-[-0.02em]">혜택연구소</span>
            <span className="ml-auto inline-flex items-center gap-1.5 h-8 pl-1 pr-3 rounded-full bg-[#f2f4f6] text-[12px] text-[#4e5968]" data-testid="landing-partner">
              {partner.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={partner.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <span className="w-6 h-6 rounded-full bg-[var(--action-primary)]/15 text-[var(--action-primary)] text-[11px] font-bold flex items-center justify-center">{partner.nickname.slice(0, 1)}</span>
              )}
              <span className="font-semibold text-[#191f28]">{partner.nickname}</span>님 추천
            </span>
          </div>
        </header>

        {/* 히어로: 약속 한 문장 */}
        <section className="px-6 pt-12 pb-10 text-center">
          <p className="inline-flex items-center gap-1 px-3 h-7 rounded-full bg-[var(--action-primary)]/10 text-[12px] font-semibold text-[var(--action-primary)]">혜택연구소 보상 약속</p>
          <h1 className="mt-5 text-[26px] leading-[1.35] font-bold tracking-[-0.02em] text-[#191f28]">
            다른 곳이 사은품을 더 주면
          </h1>
          <p className="mt-1 leading-none">
            <span className="text-[22px] font-bold align-middle">차액의</span>{' '}
            <span className="text-[72px] font-extrabold tracking-[-0.04em] text-[var(--action-primary)] align-middle tabular-nums" data-testid="landing-120">120%</span>
          </p>
          <p className="text-[26px] font-bold tracking-[-0.02em]">보상해드려요.</p>
          {maxGift > 0 && (
            <p className="mt-5 text-[15px] text-[#4e5968]">
              인터넷 최대 지원금 <span className="font-bold text-[#191f28]">{won(maxGift)}</span>
            </p>
          )}
          <button type="button" onClick={scrollToForm} className="mt-7 w-full h-14 rounded-2xl bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-white text-[17px] font-bold transition-colors" data-testid="landing-cta-top">
            내 사은품 확인하기
          </button>
          <p className="mt-3 text-[12px] text-[#8b95a1]">동일 상품 · 약정 · 관리 조건 기준</p>
        </section>

        {/* 왜 가능한가: 광고 모델을 쓰지 않는다 */}
        <section className="mx-5 rounded-[28px] bg-[#191f28] text-white px-6 py-9 overflow-hidden relative" data-testid="landing-why">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[var(--action-primary)]/25 blur-2xl" />
          <p className="text-[12px] font-semibold text-[var(--action-primary)]">어떻게 가능할까요?</p>
          <h2 className="mt-2 text-[28px] leading-[1.25] font-bold tracking-[-0.02em]">
            광고 모델을
            <br />
            쓰지 않아요.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/75">
            연예인 광고, TV 광고에 들어갈 돈을
            <br />
            <span className="text-white font-semibold">전부 고객 지원금으로</span> 돌려드려요.
            <br />
            그래서 더 줄 수 있고, 더 주는 곳이 있으면 차액까지 얹어드려요.
          </p>

          {/* 비교 막대 */}
          <div className="mt-8 grid grid-cols-2 gap-3 items-end">
            <div>
              <div className="flex flex-col gap-1">
                <div className="h-10 rounded-xl bg-white/10 flex items-center justify-center text-[12px] text-white/60">광고비</div>
                <div className="h-8 rounded-xl bg-white/10 flex items-center justify-center text-[12px] text-white/60">중간 마진</div>
                <div className="h-14 rounded-xl bg-white/25 flex items-center justify-center text-[13px] font-semibold">지원금</div>
              </div>
              <p className="mt-2 text-center text-[12px] text-white/60">다른 곳</p>
            </div>
            <div>
              <div className="flex flex-col gap-1">
                <div className="h-8 rounded-xl border border-dashed border-[var(--action-primary)]/70 flex items-center justify-center text-[12px] text-[var(--action-primary)] font-semibold">+ 차액 × 120%</div>
                <div className="h-[88px] rounded-xl bg-[var(--action-primary)] flex items-center justify-center text-[14px] font-bold text-white">지원금</div>
              </div>
              <p className="mt-2 text-center text-[12px] text-white font-semibold">혜택연구소</p>
            </div>
          </div>
          <p className="mt-6 text-[12px] text-white/50">월 요금은 어디서 가입해도 같아요. 본사 정책가 그대로예요. 다른 건 사은품뿐이에요.</p>
        </section>

        {/* 폼 */}
        <section ref={formRef} id="form" className="px-5 pt-10 pb-6 scroll-mt-14" data-testid="landing-form">
          <h2 className="text-[22px] font-bold tracking-[-0.02em]">내 사은품 확인하기</h2>
          <p className="mt-1 text-[14px] text-[#6b7684]">번호만 남기면 혜택연구소 이름으로 한 번 전화드려요.</p>

          <p className="mt-6 text-[13px] font-semibold text-[#4e5968]">어떤 혜택을 찾으세요?</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {SERVICES.map((s) => {
              const active = service === s.key
              return (
                <button key={s.key} type="button" onClick={() => setService(s.key)} data-testid={`landing-service-${s.key}`} className={`h-[68px] rounded-2xl text-left px-4 transition-colors ${active ? 'bg-[var(--action-primary)]/10 ring-2 ring-[var(--action-primary)]' : 'bg-[#f2f4f6] hover:bg-[#eceef1]'}`}>
                  <span className={`block text-[15px] font-bold ${active ? 'text-[var(--action-primary)]' : 'text-[#191f28]'}`}>{s.label}</span>
                  <span className="block mt-0.5 text-[12px] text-[#8b95a1]">{s.desc}</span>
                </button>
              )
            })}
          </div>

          <p className="mt-5 text-[13px] font-semibold text-[#4e5968]">지금 쓰고 있는 게 있나요?</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                ['new', '처음이에요', '신규 가입 혜택'],
                ['existing', '쓰는 중이에요', '약정 만료 · 이사 · 교체'],
              ] as const
            ).map(([k, label, desc]) => {
              const active = existing === k
              return (
                <button key={k} type="button" onClick={() => setExisting(k)} data-testid={`landing-existing-${k}`} className={`h-[68px] rounded-2xl text-left px-4 transition-colors ${active ? 'bg-[var(--action-primary)]/10 ring-2 ring-[var(--action-primary)]' : 'bg-[#f2f4f6] hover:bg-[#eceef1]'}`}>
                  <span className={`block text-[15px] font-bold ${active ? 'text-[var(--action-primary)]' : 'text-[#191f28]'}`}>{label}</span>
                  <span className="block mt-0.5 text-[12px] text-[#8b95a1]">{desc}</span>
                </button>
              )
            })}
          </div>

          <label className="block mt-5 text-[13px] font-semibold text-[#4e5968]" htmlFor="landing-phone">휴대폰 번호</label>
          <input
            id="landing-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="010-0000-0000"
            data-testid="landing-phone"
            className={`mt-2 w-full h-14 px-4 rounded-2xl bg-[#f2f4f6] text-[17px] font-semibold tracking-wide placeholder:font-normal placeholder:text-[#b0b8c1] focus:outline-none focus:ring-2 ${touched && !isValidPhone(phone) ? 'ring-2 ring-[#f04452]' : 'focus:ring-[var(--action-primary)]'}`}
          />

          {/* 동의 */}
          <div className="mt-4 rounded-2xl bg-[#f2f4f6] px-4 py-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center ${allAgreed ? 'bg-[var(--action-primary)] text-white' : 'bg-white text-[#d1d6db] border border-[#e5e8eb]'}`}>
                  <Check className="w-4 h-4" strokeWidth={3} />
                </span>
                <input type="checkbox" className="sr-only" checked={allAgreed} onChange={(e) => toggleAll(e.target.checked)} data-testid="landing-agree-all" />
                <span className="text-[15px] font-semibold">전체 동의</span>
              </label>
              <button type="button" onClick={() => setAgreementsOpen((v) => !v)} aria-expanded={agreementsOpen} className="p-1 text-[#8b95a1]">
                <ChevronDown className={`w-5 h-5 transition-transform ${agreementsOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {agreementsOpen && (
              <ul className="mt-3 pt-3 border-t border-[#e5e8eb] space-y-2.5">
                {LEAD_AGREEMENTS.map((a) => (
                  <li key={a.key}>
                    <label className="flex items-center gap-2.5 cursor-pointer text-[14px] text-[#4e5968]">
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

          <button type="button" onClick={submit} disabled={submitting} data-testid="landing-submit" className={`mt-4 w-full h-14 rounded-2xl text-[17px] font-bold text-white transition-colors flex items-center justify-center gap-2 ${canSubmit ? 'bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)]' : 'bg-[var(--action-primary)]/50'}`}>
            {submitting && <Loader2 className="w-5 h-5 animate-spin" />} 무료로 사은품 확인하기
          </button>
          <p className="mt-3 text-center text-[12px] text-[#8b95a1]">가입 강요 없음 · 전화 한 번으로 끝 · 설치 후 현금 지급</p>
        </section>

        {/* 사은품 표 */}
        {carriers.length > 0 && (
          <section className="px-5 py-8" data-testid="landing-gifts">
            <h2 className="text-[20px] font-bold tracking-[-0.02em]">통신사별 최대 지원금</h2>
            <p className="mt-1 text-[13px] text-[#6b7684]">지금 정책표 기준이에요. 상품·약정에 따라 달라져요.</p>
            <ul className="mt-4 rounded-2xl bg-[#f2f4f6] divide-y divide-white">
              {carriers.map((c) => (
                <li key={c.name} className="flex items-center justify-between px-4 h-14">
                  <span className="text-[15px] font-semibold">{c.name}</span>
                  <span className="text-[15px] font-bold tabular-nums">
                    {man(c.gift)}
                    {c.voucher > 0 && <span className="ml-1 text-[12px] font-medium text-[#6b7684]">+ 상품권 {man(c.voucher)}</span>}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12px] text-[#8b95a1]">가전렌탈은 제품·약정마다 달라 상담 때 금액을 먼저 확정해 알려드려요.</p>
          </section>
        )}

        {/* 절차 */}
        <section className="px-5 py-8">
          <h2 className="text-[20px] font-bold tracking-[-0.02em]">이렇게 진행돼요</h2>
          <ol className="mt-4 space-y-3">
            {[
              ['번호를 남겨요', '이름도 필요 없어요. 번호 하나면 돼요.'],
              ['혜택연구소 이름으로 전화드려요', '조건 확인 후 사은품 금액을 먼저 확정해 드려요.'],
              ['설치 후 현금으로 받아요', '설치 확인되면 정해진 금액이 계좌로 들어가요.'],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4 rounded-2xl bg-[#f2f4f6] px-4 py-4">
                <span className="w-7 h-7 shrink-0 rounded-full bg-[#191f28] text-white text-[13px] font-bold flex items-center justify-center">{i + 1}</span>
                <div>
                  <p className="text-[15px] font-bold">{t}</p>
                  <p className="mt-0.5 text-[13px] text-[#6b7684]">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* 조건 */}
        <section className="px-5 pb-10">
          <details className="group rounded-2xl bg-[#f2f4f6] px-4" data-testid="landing-terms">
            <summary className="flex items-center justify-between h-14 cursor-pointer list-none text-[15px] font-semibold">
              120% 보상, 꼭 알아두세요
              <ChevronDown className="w-5 h-5 text-[#8b95a1] transition-transform group-open:rotate-180" />
            </summary>
            <ul className="pb-4 space-y-1.5 text-[13px] leading-relaxed text-[#4e5968] list-disc pl-4">
              <li>같은 통신사·상품·약정·관리 조건으로 비교해요.</li>
              <li>설치 전에 다른 곳의 견적(문자·카톡 캡처 등)을 보여주시면 차액의 120%를 사은품에 더해드려요.</li>
              <li>사은품은 설치 완료 후 지급돼요. 렌탈료·프로모션은 접수일 기준이에요.</li>
              <li>카드 할인 조건부 가격, 중복 불가 이벤트는 비교 대상이 아니에요.</li>
            </ul>
          </details>
        </section>

        {/* 푸터 */}
        <footer className="px-5 pb-28 text-[11px] leading-relaxed text-[#8b95a1]">
          <p>피움 · 사업자등록번호 573-07-03391 · 통신판매업 신고번호 2026-창원진해-0365</p>
          <p>경상남도 창원시 진해구 충장로 68-1, 2층 1호 · 대표번호 010-7469-4385</p>
        </footer>
      </div>

      {/* 하단 고정 CTA (폼이 안 보일 때만) */}
      {!formInView && !done && (
        <div className="fixed bottom-0 inset-x-0 z-30 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-white via-white/95 to-transparent">
          <div className="max-w-[520px] mx-auto flex gap-2">
            <a href="tel:01074694385" aria-label="전화하기" className="w-14 h-14 shrink-0 rounded-2xl bg-[#f2f4f6] flex items-center justify-center text-[#333d4b]">
              <Phone className="w-5 h-5" />
            </a>
            <button type="button" onClick={scrollToForm} data-testid="landing-cta-sticky" className="flex-1 h-14 rounded-2xl bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-white text-[17px] font-bold shadow-[0_8px_24px_rgba(255,143,171,0.35)] transition-colors">
              내 사은품 확인하기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
