'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BadgePercent, Banknote, Check, ChevronRight, PhoneCall, ShieldCheck, Sparkles, Wallet } from 'lucide-react'
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'

// 메인 홈 데모. 혜소의 정체성(분홍 #ff8fab, 토스식 여백과 둥근 면, 세 가지 서비스)을 지키면서
// 대형 서비스 홈처럼 움직임과 실데이터로 설득한다. 모든 숫자는 서버에서 DB 로 채운다.
export type DemoData = {
  carriers: { name: string; logo: string; gift: number }[]
  maxGift: number
  products: { slug: string; brand: string; name: string; image: string; category: string; categorySlug: string; fee: number | null }[]
  productCount: number
  brands: string[]
}

const ICON = 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/public/HYESO-LAB/icons'
const won = (n: number) => n.toLocaleString('ko-KR')
const man = (n: number) => (n % 10000 === 0 ? `${n / 10000}만원` : `${won(n)}원`)

/* ---------- 작은 도구들 ---------- */

// 화면에 들어오면 .is-in 을 붙인다(한 번만). data-delay 로 순서를 준다
function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.demo-reveal'))
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const el = e.target as HTMLElement
          el.style.transitionDelay = `${Number(el.dataset.delay ?? 0)}ms`
          el.classList.add('is-in')
          io.unobserve(el)
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

// 숫자가 0에서 목표까지 올라간다(화면에 들어올 때)
function CountUp({ to, suffix = '', prefix = '', duration = 1400 }: { to: number; suffix?: string; prefix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [v, setV] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration)
        const eased = 1 - Math.pow(1 - p, 3)
        setV(Math.round(to * eased))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.6 })
    io.observe(el)
    return () => io.disconnect()
  }, [to, duration])
  return <span ref={ref} className="tabular-nums">{prefix}{won(v)}{suffix}</span>
}

// 마우스를 따라 살짝 기울어지는 카드
function Tilt({ children, className = '', max = 6 }: { children: React.ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(900px) rotateX(${-y * max}deg) rotateY(${x * max}deg) translateY(-4px)`
  }
  const reset = () => { if (ref.current) ref.current.style.transform = '' }
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={reset} className={`transition-transform duration-300 will-change-transform ${className}`}>
      {children}
    </div>
  )
}

/* ---------- 섹션들 ---------- */

function Hero({ maxGift, productCount }: { maxGift: number; productCount: number }) {
  const words = ['놓치고', '있던', '혜택,']
  return (
    <section className="relative overflow-hidden -mt-[58px] pt-[58px]">
      {/* 배경: 천천히 움직이는 분홍 블롭 + 아주 옅은 격자 */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#ffffff_0%,#fff6f8_55%,#ffffff_100%)]" />
      <div aria-hidden className="demo-blob absolute -z-10 -top-32 -left-24 w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(255,143,171,0.28),rgba(255,143,171,0)_62%)]" />
      <div aria-hidden className="demo-blob absolute -z-10 top-24 -right-32 w-[640px] h-[640px] rounded-full bg-[radial-gradient(circle,rgba(255,209,221,0.55),rgba(255,209,221,0)_60%)]" style={{ animationDelay: '-7s' }} />
      <div aria-hidden className="absolute inset-0 -z-10 opacity-[0.35] [background-image:linear-gradient(to_right,#f2f4f6_1px,transparent_1px),linear-gradient(to_bottom,#f2f4f6_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

      <div className="max-w-[1100px] mx-auto px-6 pt-14 pb-16 lg:pt-24 lg:pb-28 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-8 items-center">
        <div className="text-center lg:text-left">
          <Link href="/m/S-MASTER" className="demo-reveal inline-flex items-center gap-2 h-9 pl-1.5 pr-3.5 rounded-full bg-white shadow-[0_2px_14px_rgba(255,143,171,0.25)] ring-1 ring-[#ffd1dd] text-[13px] font-medium text-[#4e5968] hover:ring-[#ff8fab] transition-colors">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#ff8fab] text-white"><BadgePercent className="w-3.5 h-3.5" /></span>
            타사보다 혜택이 적으면 차액 120% 보상
            <ChevronRight className="w-4 h-4 text-[#b0b8c1]" />
          </Link>

          <h1 className="mt-6 text-[40px] leading-[1.12] sm:text-[52px] lg:text-[64px] font-bold tracking-[-0.035em] text-[#191f28]">
            {words.map((w, i) => (
              <span key={w} className="demo-reveal inline-block" data-delay={120 + i * 90}>{w}{'\u00a0'}</span>
            ))}
            <br />
            <span className="demo-reveal inline-block" data-delay={420}>
              <span className="relative inline-block">
                <span className="relative z-10 text-[#ff8fab]">대신</span>
                <span aria-hidden className="absolute left-0 right-0 bottom-[0.08em] h-[0.32em] bg-[#ffe3ea] rounded-sm -z-0" />
              </span>{' '}
              알아볼게요
            </span>
          </h1>

          <p className="demo-reveal mt-6 text-[17px] lg:text-[20px] leading-relaxed text-[#6b7684]" data-delay={520}>
            <span className="sm:hidden">번호 하나만 남기면<br />조건 비교부터 사은품 확정까지.</span>
            <span className="hidden sm:inline">인터넷·가전렌탈·카드, 번호 하나만 남기면<br />혜택연구소가 조건을 비교하고 사은품까지 확정해 드려요.</span>
          </p>

          <div className="demo-reveal mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start" data-delay={640}>
            <Link href="/apply" className="demo-pulse relative overflow-hidden demo-shine inline-flex items-center justify-center gap-2 h-14 px-7 rounded-2xl bg-[#ff8fab] hover:bg-[#ff7096] text-white text-[16px] font-semibold transition-colors">
              연구 시작하기 <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/internet" className="inline-flex items-center justify-center gap-2 h-14 px-7 rounded-2xl bg-white ring-1 ring-[#e5e8eb] hover:ring-[#ff8fab] text-[#333d4b] text-[16px] font-semibold transition-colors">
              사은품 먼저 보기
            </Link>
          </div>

          <ul className="demo-reveal mt-8 flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 text-[13px] text-[#8b95a1]" data-delay={760}>
            {['가입 강요 없음', '전화 한 번으로 끝', '설치 후 현금 지급'].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#ff8fab]" strokeWidth={3} /> {t}</li>
            ))}
          </ul>
        </div>

        {/* 떠 있는 서비스 카드 셋 */}
        <div className="relative h-[380px] sm:h-[440px] lg:h-[520px]" aria-hidden>
          <FloatCard className="left-[6%] top-[8%] w-[46%] max-w-[230px]" delay={0} rotate={-4}>
            <Image src={`${ICON}/internet_icon.png`} alt="" width={96} height={96} className="w-16 h-16" />
            <p className="mt-3 text-[15px] font-semibold text-[#191f28]">인터넷·TV</p>
            <p className="text-[12px] text-[#8b95a1]">KT · LG U+ · SK</p>
            <span className="mt-3 inline-flex h-7 px-2.5 items-center rounded-full bg-[#fff1f5] text-[12px] font-semibold text-[#ff5c8a]">최대 {man(maxGift)}</span>
          </FloatCard>
          <FloatCard className="right-[4%] top-[2%] w-[44%] max-w-[220px]" delay={-2.2} rotate={5}>
            <Image src={`${ICON}/card_icon.png`} alt="" width={96} height={96} className="w-16 h-16" />
            <p className="mt-3 text-[15px] font-semibold text-[#191f28]">카드</p>
            <p className="text-[12px] text-[#8b95a1]">연회비 · 캐시백 비교</p>
            <span className="mt-3 inline-flex h-7 px-2.5 items-center rounded-full bg-[#f2f4f6] text-[12px] font-semibold text-[#4e5968]">7개 카드사</span>
          </FloatCard>
          <FloatCard className="left-[24%] bottom-[4%] w-[52%] max-w-[260px]" delay={-4.1} rotate={2}>
            <Image src={`${ICON}/electronics_icon.png`} alt="" width={96} height={96} className="w-16 h-16" />
            <p className="mt-3 text-[15px] font-semibold text-[#191f28]">가전렌탈</p>
            <p className="text-[12px] text-[#8b95a1]">정수기 · 공기청정기 · 비데</p>
            <span className="mt-3 inline-flex h-7 px-2.5 items-center rounded-full bg-[#f2f4f6] text-[12px] font-semibold text-[#4e5968]">{won(productCount)}종 비교</span>
          </FloatCard>
          {/* 가운데 배지 */}
          <div className="demo-float absolute left-1/2 top-[50%] sm:top-[44%] -translate-x-1/2 -translate-y-1/2 h-10 px-4 rounded-full bg-[#191f28] text-white text-[13px] font-semibold flex items-center gap-2 shadow-xl" style={{ animationDelay: '-1s' }}>
            <Sparkles className="w-4 h-4 text-[#ff8fab]" /> 한 번에 비교
          </div>
        </div>
      </div>
    </section>
  )
}

function FloatCard({ children, className, delay, rotate }: { children: React.ReactNode; className: string; delay: number; rotate: number }) {
  return (
    <div className={`demo-float absolute ${className}`} style={{ animationDelay: `${delay}s`, ['--r' as string]: `${rotate}deg` }}>
      <div className="rounded-[24px] bg-white/90 backdrop-blur p-5 shadow-[0_18px_50px_rgba(25,31,40,0.10)] ring-1 ring-black/[0.04]">{children}</div>
    </div>
  )
}

function Marquee({ carriers, brands }: { carriers: DemoData['carriers']; brands: string[] }) {
  const items = [
    ...carriers.map((c) => ({ kind: 'logo' as const, name: c.name, logo: c.logo })),
    ...brands.map((b) => ({ kind: 'text' as const, name: b, logo: '' })),
  ]
  const row = [...items, ...items]
  return (
    <section className="py-8 border-y border-[#f2f4f6] bg-white overflow-hidden" aria-label="함께하는 통신사와 브랜드">
      <div className="demo-marquee flex w-max items-center gap-10" style={{ ['--d' as string]: `${items.length * 3}s` }}>
        {row.map((it, i) => (
          <span key={i} className="shrink-0 flex items-center gap-2 text-[15px] font-semibold text-[#8b95a1]">
            {it.kind === 'logo' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.logo} alt={it.name} className="h-6 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition" />
            ) : (
              it.name
            )}
          </span>
        ))}
      </div>
    </section>
  )
}

function Stats({ d }: { d: DemoData }) {
  const stats = [
    { label: '비교하는 렌탈 상품', value: d.productCount, suffix: '종' },
    { label: '인터넷 최대 지원금', value: Math.round(d.maxGift / 10000), suffix: '만원' },
    { label: '제휴 통신사', value: d.carriers.length, suffix: '곳' },
    { label: '렌탈 브랜드', value: d.brands.length, suffix: '개' },
  ]
  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-[1100px] mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((s, i) => (
          <div key={s.label} className="demo-reveal rounded-[24px] bg-white ring-1 ring-black/[0.04] shadow-[0_8px_30px_rgba(25,31,40,0.04)] p-6 lg:p-8" data-delay={i * 90}>
            <p className="text-[13px] text-[#8b95a1]">{s.label}</p>
            <p className="mt-2 text-[34px] lg:text-[44px] font-bold tracking-[-0.03em] text-[#191f28] leading-none">
              <CountUp to={s.value} suffix={s.suffix} />
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Services({ d }: { d: DemoData }) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  return (
    <section className="py-8 lg:py-16">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="demo-reveal text-center mb-10 lg:mb-14">
          <p className="text-[13px] font-semibold text-[#ff8fab]">서비스</p>
          <h2 className="mt-2 text-[30px] lg:text-[44px] font-bold tracking-[-0.03em] text-[#191f28] leading-tight">어떤 혜택을 연구해 볼까요?</h2>
        </div>

        <div className="grid lg:grid-cols-5 gap-4 lg:gap-5">
          {/* 인터넷: 큰 카드 */}
          <Tilt className="lg:col-span-3 demo-reveal">
            <Link href="/internet" className="group block h-full rounded-[28px] bg-[#191f28] text-white p-7 lg:p-9 overflow-hidden relative">
              <div aria-hidden className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#ff8fab]/25 blur-3xl" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-[13px] text-white/60">인터넷 · TV</p>
                  <h3 className="mt-1.5 text-[26px] lg:text-[32px] font-bold tracking-[-0.02em] leading-tight">통신사만 고르면<br />사은품이 바로 보여요</h3>
                </div>
                <Image src={`${ICON}/internet_icon.png`} alt="" width={96} height={96} className="w-14 h-14 lg:w-16 lg:h-16 shrink-0" />
              </div>
              <ul className="relative mt-7 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {d.carriers.slice(0, 6).map((c) => {
                  const open = !!revealed[c.name]
                  return (
                    <li key={c.name}>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setRevealed((r) => ({ ...r, [c.name]: true })) }}
                        className="w-full h-[52px] rounded-2xl bg-white/10 hover:bg-white/15 px-3 flex items-center justify-between gap-2 transition-colors"
                      >
                        <span className="text-[13px] font-medium truncate">{c.name}</span>
                        {open ? (
                          <span className="landing-pop shrink-0 h-7 px-2 rounded-full bg-[#ff8fab] text-[12px] font-bold flex items-center">{man(c.gift)}</span>
                        ) : (
                          <span className="shrink-0 text-[12px] text-[#ff9fb8]">확인</span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
              <p className="relative mt-5 inline-flex items-center gap-1 text-[14px] font-semibold text-[#ff9fb8] group-hover:gap-2 transition-all">최대 {man(d.maxGift)} · 자세히 보기 <ArrowRight className="w-4 h-4" /></p>
            </Link>
          </Tilt>

          {/* 가전렌탈 */}
          <Tilt className="lg:col-span-2 demo-reveal" >
            <Link href="/electronics" className="group block h-full rounded-[28px] bg-[#fff1f5] p-7 lg:p-8 overflow-hidden relative">
              <p className="text-[13px] text-[#ff5c8a] font-semibold">가전렌탈</p>
              <h3 className="mt-1.5 text-[24px] lg:text-[26px] font-bold tracking-[-0.02em] text-[#191f28] leading-tight">{won(d.productCount)}종을<br />월 요금으로 비교</h3>
              <div className="mt-5 flex items-end gap-2 h-[120px]">
                {d.products.slice(0, 3).map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p.slug} src={p.image} alt="" className="h-[110px] w-[30%] object-contain drop-shadow-[0_12px_18px_rgba(255,143,171,0.25)] group-hover:-translate-y-1 transition-transform" loading="lazy" />
                ))}
              </div>
              <p className="mt-4 text-[13px] text-[#6b7684]">월 {won(Math.min(...d.products.filter((p) => p.fee).map((p) => p.fee as number)))}원부터 · 7개 브랜드</p>
            </Link>
          </Tilt>

          {/* 카드 */}
          <Tilt className="lg:col-span-2 demo-reveal">
            <Link href="/card" className="group block h-full rounded-[28px] bg-white ring-1 ring-black/[0.05] p-7 lg:p-8 overflow-hidden relative">
              <p className="text-[13px] text-[#8b95a1] font-semibold">카드</p>
              <h3 className="mt-1.5 text-[24px] lg:text-[26px] font-bold tracking-[-0.02em] text-[#191f28] leading-tight">연회비·캐시백<br />한눈에 비교</h3>
              <div className="mt-5 flex -space-x-2">
                {['shinhan', 'kb', 'samsung', 'hyundai', 'woori', 'nh'].map((b) => (
                  <span key={b} className="w-12 h-12 rounded-full bg-[#f9fafb] ring-2 ring-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${ICON}/app/card/${b}-cardlogo-icon.png`} alt={b} className="w-8 h-8 object-contain rounded-md" loading="lazy" />
                  </span>
                ))}
              </div>
              <p className="mt-4 text-[13px] text-[#6b7684]">주요 카드사 혜택을 조건별로 정리해요</p>
            </Link>
          </Tilt>

          {/* 120% 약속 */}
          <Tilt className="lg:col-span-3 demo-reveal">
            <div className="h-full rounded-[28px] bg-white ring-1 ring-black/[0.05] p-7 lg:p-8 grid sm:grid-cols-[1fr_auto] gap-6 items-center">
              <div>
                <p className="text-[13px] text-[#8b95a1] font-semibold">혜택연구소 보상 약속</p>
                <h3 className="mt-1.5 text-[24px] lg:text-[26px] font-bold tracking-[-0.02em] text-[#191f28] leading-tight">혜소보다 더 주면<br /><span className="text-[#ff8fab]">차액의 120%</span> 보상해드려요</h3>
                <p className="mt-3 text-[14px] text-[#6b7684] leading-relaxed">광고에 쓸 돈을 전부 고객에게 돌려드려요. 월 요금은 어디나 같고, 다른 건 사은품뿐이에요.</p>
              </div>
              <CompareMini />
            </div>
          </Tilt>
        </div>
      </div>
    </section>
  )
}

function CompareMini() {
  return (
    <div className="w-full sm:w-[200px] rounded-2xl bg-[#f9fafb] p-4">
      <div className="grid grid-cols-2 gap-3 items-end h-[132px]">
        <div className="flex flex-col justify-end gap-1 h-full">
          <div className="demo-grow h-8 rounded-lg bg-[#f2f4f6]" style={{ animationDelay: '0ms' }} />
          <div className="demo-grow h-6 rounded-lg bg-[#f2f4f6]" style={{ animationDelay: '80ms' }} />
          <div className="demo-grow h-10 rounded-lg bg-[#d1d6db]" style={{ animationDelay: '160ms' }} />
        </div>
        <div className="relative flex flex-col justify-end h-full">
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 whitespace-nowrap h-6 px-2 rounded-full bg-[#191f28] text-white text-[10px] font-semibold flex items-center">+ 차액 × 120%</span>
          <div className="demo-grow h-[96px] rounded-lg bg-gradient-to-t from-[#ff7096] to-[#ff9fb8]" style={{ animationDelay: '240ms' }} />
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 text-center text-[11px]"><span className="text-[#8b95a1]">다른 곳</span><span className="text-[#333d4b] font-medium">혜택연구소</span></div>
    </div>
  )
}

function Steps() {
  const steps = [
    { icon: PhoneCall, title: '번호를 남겨요', desc: '이름도 필요 없어요. 번호 하나면 돼요.' },
    { icon: ShieldCheck, title: '혜택연구소에서 전화 드려요', desc: '조건을 비교하고 사은품 금액을 먼저 확정해요.' },
    { icon: Banknote, title: '설치 후 현금으로 받아요', desc: '정해진 금액이 계좌로 들어가요.' },
  ]
  return (
    <section className="py-20 lg:py-28 bg-[#f9fafb]">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="demo-reveal text-center mb-12 lg:mb-16">
          <p className="text-[13px] font-semibold text-[#ff8fab]">진행 방식</p>
          <h2 className="mt-2 text-[30px] lg:text-[44px] font-bold tracking-[-0.03em] text-[#191f28] leading-tight">세 단계면 끝나요</h2>
        </div>
        <div className="relative grid lg:grid-cols-3 gap-5 lg:gap-8">
          <svg aria-hidden className="hidden lg:block absolute top-[46px] left-[16%] right-[16%] h-2 w-[68%]" viewBox="0 0 100 2" preserveAspectRatio="none">
            <path d="M0 1 H100" stroke="#ffd1dd" strokeWidth="2" strokeDasharray="1 0" pathLength={1} className="demo-draw" />
          </svg>
          {steps.map((s, i) => (
            <div key={s.title} className="demo-reveal relative rounded-[28px] bg-white p-7 lg:p-8 ring-1 ring-black/[0.04]" data-delay={i * 140}>
              <div className="relative w-[60px] h-[60px] rounded-2xl bg-[#fff1f5] flex items-center justify-center">
                <s.icon className="w-7 h-7 text-[#ff5c8a]" strokeWidth={1.8} />
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#191f28] text-white text-[12px] font-bold flex items-center justify-center">{i + 1}</span>
              </div>
              <h3 className="mt-5 text-[19px] font-semibold text-[#191f28] tracking-[-0.01em]">{s.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#6b7684]">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Products({ products }: { products: DemoData['products'] }) {
  return (
    <section className="py-20 lg:py-28 overflow-hidden">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="demo-reveal flex items-end justify-between gap-4 mb-8 lg:mb-10">
          <div>
            <p className="text-[13px] font-semibold text-[#ff8fab]">가전렌탈</p>
            <h2 className="mt-2 text-[30px] lg:text-[44px] font-bold tracking-[-0.03em] text-[#191f28] leading-tight">요즘 많이 찾는 상품</h2>
          </div>
          <Link href="/electronics" className="hidden sm:inline-flex items-center gap-1 text-[14px] font-semibold text-[#4e5968] hover:text-[#ff8fab]">전체 보기 <ChevronRight className="w-4 h-4" /></Link>
        </div>
      </div>
      <div className="max-w-[1100px] mx-auto pl-6 lg:px-6">
        <ul className="flex lg:grid lg:grid-cols-4 gap-4 overflow-x-auto snap-x snap-mandatory pr-6 lg:pr-0 pb-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {products.map((p, i) => (
            <li key={p.slug} className="demo-reveal shrink-0 w-[220px] lg:w-auto snap-start" data-delay={i * 70}>
              <Link href={`/electronics/${p.categorySlug}/${p.slug}`} className="group block rounded-[24px] bg-white ring-1 ring-black/[0.04] p-4 hover:shadow-[0_18px_40px_rgba(25,31,40,0.08)] hover:-translate-y-1 transition-all">
                <div className="aspect-square rounded-2xl bg-[#f9fafb] flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={p.name} className="h-[78%] w-auto object-contain group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
                <p className="mt-3 text-[12px] text-[#8b95a1]">{p.brand} · {p.category}</p>
                <p className="mt-0.5 text-[15px] font-medium text-[#191f28] line-clamp-1">{p.name}</p>
                {p.fee && <p className="mt-1.5 text-[16px] font-bold text-[#191f28]">월 {won(p.fee)}원<span className="text-[12px] font-medium text-[#8b95a1]">부터</span></p>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Partners() {
  return (
    <section className="py-8 lg:py-16">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="demo-reveal relative overflow-hidden rounded-[32px] bg-[#191f28] text-white px-7 py-12 lg:px-14 lg:py-16 grid lg:grid-cols-[1fr_auto] gap-8 items-center">
          <div aria-hidden className="absolute -left-20 -bottom-24 w-72 h-72 rounded-full bg-[#ff8fab]/30 blur-3xl" />
          <div className="relative">
            <p className="text-[13px] font-semibold text-[#ff9fb8]">혜소 파트너스</p>
            <h2 className="mt-2 text-[28px] lg:text-[40px] font-bold tracking-[-0.03em] leading-tight">블로그 글 하나로<br />집에서 시작하는 온라인 부업</h2>
            <p className="mt-4 text-[15px] text-white/70 leading-relaxed">내 링크로 들어온 상담은 자동으로 내 실적. 전화·접수·사은품은 혜택연구소가 다 해요.</p>
          </div>
          <Link href="/partners/register" className="relative inline-flex items-center justify-center gap-2 h-14 px-7 rounded-2xl bg-white text-[#191f28] text-[16px] font-semibold hover:bg-[#fff1f5] transition-colors">
            <Wallet className="w-5 h-5 text-[#ff8fab]" /> 파트너 신청하기
          </Link>
        </div>
      </div>
    </section>
  )
}

function FinalCta({ maxGift }: { maxGift: number }) {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-[720px] mx-auto px-6 text-center">
        <p className="demo-reveal text-[13px] font-semibold text-[#ff8fab]">지금 바로</p>
        <h2 className="demo-reveal mt-2 text-[32px] lg:text-[48px] font-bold tracking-[-0.03em] text-[#191f28] leading-tight" data-delay={80}>놓치고 있던 혜택,<br />지금 알아봐요</h2>
        <p className="demo-reveal mt-4 text-[16px] text-[#6b7684]" data-delay={160}>인터넷 최대 {man(maxGift)}. 번호 하나만 남기면 돼요.</p>
        <div className="demo-reveal mt-8" data-delay={240}>
          <Link href="/apply" className="demo-shine relative overflow-hidden inline-flex items-center justify-center gap-2 h-14 px-8 rounded-2xl bg-[#ff8fab] hover:bg-[#ff7096] text-white text-[16px] font-semibold transition-colors">
            연구 시작하기 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default function DemoHome({ data }: { data: DemoData }) {
  useReveal()
  return (
    <div className="min-h-screen bg-white text-[#191f28]" data-testid="demo-home">
      <Navbar />
      <Hero maxGift={data.maxGift} productCount={data.productCount} />
      <Marquee carriers={data.carriers} brands={data.brands} />
      <Stats d={data} />
      <Services d={data} />
      <Steps />
      <Products products={data.products} />
      <Partners />
      <FinalCta maxGift={data.maxGift} />
      <Footer />
    </div>
  )
}
