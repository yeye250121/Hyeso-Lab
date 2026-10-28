'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'

// 메인 홈 데모 v2. 장식 대신 타이포·여백·1px 선·실데이터로 설득한다.
// 색은 거의 흑백이고 분홍(#ff8fab)은 점·한 단어·버튼에만 쓴다.
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

/* ---------- 도구 ---------- */

function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.demo-in'))
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
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

function CountUp({ to, format = won, duration = 1600 }: { to: number; format?: (n: number) => string; duration?: number }) {
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
        setV(Math.round(to * (1 - Math.pow(1 - p, 4))))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.5 })
    io.observe(el)
    return () => io.disconnect()
  }, [to, duration])
  return <span ref={ref}>{format(v)}</span>
}

// ₩ 텍스처 띠. 결정적 난수라 서버·클라이언트가 같은 글자를 그린다.
function WonBand({ rows = 6, dark = false }: { rows?: number; dark?: boolean }) {
  const lines: string[] = []
  let seed = 7
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
  for (let r = 0; r < rows; r++) {
    let line = ''
    for (let c = 0; c < 220; c++) {
      const x = rnd()
      line += x < 0.07 ? '₩' : x < 0.1 ? '$' : x < 0.115 ? '/' : ' '
    }
    lines.push(line)
  }
  return (
    <div aria-hidden className={`mono overflow-hidden select-none leading-[1.35] text-[11px] whitespace-pre ${dark ? 'text-white/20' : 'text-[#c9ced6]'}`}>
      {lines.map((l, i) => (
        <div key={i} className="-ml-[2ch]">{l}</div>
      ))}
    </div>
  )
}

const Eyebrow = ({ n, children, light = false }: { n?: string; children: React.ReactNode; light?: boolean }) => (
  <p className={`mono text-[12px] uppercase tracking-[0.08em] ${light ? 'text-white/50' : 'text-[#8b95a1]'}`}>
    {n && <span className="mr-3 text-[#ff8fab]">{n}</span>}
    {children}
  </p>
)

/* ---------- 섹션 ---------- */

function Hero({ maxGift }: { maxGift: number }) {
  return (
    <section className="relative -mt-[58px] pt-[58px]">
      <div className="max-w-[1180px] mx-auto px-6 lg:px-10 pt-16 pb-12 lg:pt-28 lg:pb-16">
        <Eyebrow n="혜택연구소">인터넷 · 가전렌탈 · 카드</Eyebrow>
        <h1 className="demo-in mt-7 text-[46px] leading-[1.06] sm:text-[64px] lg:text-[96px] font-bold tracking-[-0.045em] text-[#111318] max-w-[14ch]">
          놓치고 있던 혜택,
          <br />
          <span className="text-[#ff8fab]">대신</span> 알아볼게요
        </h1>
        <div className="mt-9 lg:mt-12 grid lg:grid-cols-[1fr_auto] gap-8 items-end">
          <p className="demo-in text-[18px] lg:text-[22px] leading-[1.5] text-[#4e5968] font-normal max-w-[34ch]" data-delay={100}>
            번호 하나만 남기면 조건을 비교하고
            <br className="hidden sm:block" /> 사은품 금액까지 확정해 드려요.{' '}
            <span className="text-[#b0b8c1]">상담은 한 번, 설치 후 현금 지급.</span>
          </p>
          <div className="demo-in flex flex-col sm:flex-row gap-3" data-delay={200}>
            <Link href="/apply" className="inline-flex items-center justify-center gap-2 h-[52px] px-6 rounded-full bg-[#111318] text-white text-[15px] font-medium hover:bg-[#2b2f36] transition-colors">
              연구 시작하기 <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/internet" className="inline-flex items-center justify-center gap-2 h-[52px] px-6 rounded-full border border-[#d1d6db] text-[#111318] text-[15px] font-medium hover:border-[#111318] transition-colors">
              사은품 먼저 보기
            </Link>
          </div>
        </div>
        <p className="demo-in mono mt-10 lg:mt-14 text-[12px] text-[#8b95a1] flex items-center gap-2" data-delay={300}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff8fab]" /> 타사보다 혜택이 적으면 차액 120% 보상 · 인터넷 최대 {man(maxGift)}
        </p>
      </div>
    </section>
  )
}

function LogoGrid({ carriers, brands }: { carriers: DemoData['carriers']; brands: string[] }) {
  const cells = [
    ...carriers.map((c) => ({ kind: 'logo' as const, name: c.name, logo: c.logo })),
    ...brands.map((b) => ({ kind: 'text' as const, name: b, logo: '' })),
  ]
  return (
    <section className="border-b border-[#e5e8eb] -mt-px">
      <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-l border-[#e5e8eb]">
          <div className="col-span-2 sm:col-span-3 lg:col-span-2 h-[84px] border-r border-b border-[#e5e8eb] flex items-center px-5">
            <Eyebrow>함께하는 통신사 {carriers.length}곳 · 렌탈 브랜드 {brands.length}개</Eyebrow>
          </div>
          {cells.map((c) => (
            <div key={c.name} className="h-[84px] border-r border-b border-[#e5e8eb] flex items-center justify-center px-4">
              {c.kind === 'logo' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.logo} alt={c.name} className="h-5 w-auto max-w-[110px] grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition" />
              ) : (
                <span className="text-[15px] font-semibold text-[#6b7684]">{c.name}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// 히어로 바로 아래 "제품 샷": 통신사별 최대 지원금 보고서 프레임. 화면에 들어오면 막대가 자란다.
function Report({ carriers, maxGift }: { carriers: DemoData['carriers']; maxGift: number }) {
  const rows = [...carriers].sort((a, b) => b.gift - a.gift)
  return (
    <section className="pb-16 lg:pb-24">
      <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
        <div className="demo-in rounded-[20px] lg:rounded-[28px] border border-[#e5e8eb] bg-white overflow-hidden shadow-[0_1px_0_rgba(17,19,24,0.04),0_24px_60px_-30px_rgba(17,19,24,0.18)]" data-delay={150}>
          <div className="grid lg:grid-cols-[380px_1fr]">
            <div className="p-6 lg:p-9 border-b lg:border-b-0 lg:border-r border-[#e5e8eb]">
              <Eyebrow>연구 보고서 · 인터넷 · TV</Eyebrow>
              <h2 className="mt-4 text-[26px] lg:text-[30px] font-bold tracking-[-0.035em] leading-[1.15] text-[#111318] break-keep">통신사만 고르면<br />사은품이 바로 보여요</h2>
              <p className="mt-4 text-[14px] lg:text-[15px] leading-relaxed text-[#6b7684]">월 요금은 어디서 가입해도 같아요. 다른 건 사은품뿐이라, 정책표 그대로 금액을 먼저 보여드려요.</p>
              <Link href="/internet" className="mt-6 inline-flex items-center gap-1 text-[14px] font-medium text-[#111318] hover:text-[#ff8fab]">통신사별 상품 보기 <ArrowUpRight className="w-4 h-4" /></Link>
            </div>
            <div>
              <div className="flex items-center justify-between px-5 lg:px-8 h-12 border-b border-[#e5e8eb]">
                <span className="mono text-[12px] text-[#8b95a1]">최대 지원금</span>
                <span className="mono text-[12px] text-[#8b95a1]">단위 원</span>
              </div>
              <ol className="divide-y divide-[#f2f4f6]" data-testid="demo-report">
                {rows.map((c, i) => (
                  <li key={c.name} className="grid grid-cols-[96px_1fr_auto] sm:grid-cols-[150px_1fr_auto] items-center gap-4 px-5 lg:px-8 h-[60px] lg:h-[66px]">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="mono text-[12px] text-[#b0b8c1] w-5">{String(i + 1).padStart(2, '0')}</span>
                      <span className="text-[14px] lg:text-[15px] font-medium text-[#111318] truncate">{c.name}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[#f2f4f6] overflow-hidden">
                      <div className="demo-bar h-full rounded-full bg-[#ff8fab]" style={{ width: `${Math.max(6, (c.gift / maxGift) * 100)}%`, transitionDelay: `${i * 90 + 200}ms` }} />
                    </div>
                    <span className="mono text-[14px] lg:text-[15px] font-medium text-[#111318] tabular-nums w-[84px] lg:w-[96px] text-right">
                      <CountUp to={c.gift} />
                    </span>
                  </li>
                ))}
              </ol>
              <p className="px-5 lg:px-8 h-12 border-t border-[#f2f4f6] flex items-center text-[12px] text-[#8b95a1]">가전렌탈 사은품은 제품·약정마다 달라 상담 때 먼저 확정해 드려요.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-16 lg:mt-24 border-y border-[#e5e8eb] py-4"><WonBand rows={5} /></div>
    </section>
  )
}

function Services({ d }: { d: DemoData }) {
  const items = [
    { n: '01', title: '인터넷 · TV', desc: '통신사만 고르면 월 요금과 사은품이 바로 계산돼요.', href: '/internet', icon: `${ICON}/internet_icon.png`, meta: `최대 ${man(d.maxGift)}` },
    { n: '02', title: '가전렌탈', desc: '정수기부터 생활가전까지 월 요금으로 비교해요.', href: '/electronics', icon: `${ICON}/electronics_icon.png`, meta: `${won(d.productCount)}종` },
    { n: '03', title: '카드', desc: '연회비와 캐시백을 조건별로 정리해요.', href: '/card', icon: `${ICON}/card_icon.png`, meta: '7개 카드사' },
  ]
  return (
    <section className="border-t border-[#e5e8eb]">
      <div className="max-w-[1180px] mx-auto px-6 lg:px-10 pt-20 lg:pt-32">
        <Eyebrow n="01">서비스</Eyebrow>
        <h2 className="demo-in mt-5 text-[32px] sm:text-[40px] lg:text-[56px] font-bold tracking-[-0.04em] leading-[1.1] text-[#111318]">어떤 혜택을 연구해 볼까요?</h2>
      </div>
      <div className="max-w-[1180px] mx-auto px-6 lg:px-10 mt-10 lg:mt-14">
        <ul className="grid lg:grid-cols-3 border-t border-l border-[#e5e8eb]">
          {items.map((it, i) => (
            <li key={it.n} className="demo-in border-r border-b border-[#e5e8eb]" data-delay={i * 80}>
              <Link href={it.href} className="group block p-7 lg:p-9 h-full hover:bg-[#fafbfc] transition-colors">
                <div className="flex items-center justify-between">
                  <Eyebrow n={it.n}>{it.meta}</Eyebrow>
                  <ArrowUpRight className="w-5 h-5 text-[#b0b8c1] group-hover:text-[#111318] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.icon} alt="" className="mt-10 lg:mt-14 w-[72px] h-[72px] lg:w-[88px] lg:h-[88px] object-contain" loading="lazy" />
                <h3 className="mt-6 text-[24px] lg:text-[28px] font-bold tracking-[-0.03em] text-[#111318]">{it.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#6b7684]">{it.desc}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Promise() {
  return (
    <section className="mt-20 lg:mt-32 bg-[#111318] text-white">
      <div className="max-w-[1180px] mx-auto px-6 lg:px-10 pt-20 lg:pt-32 pb-16 lg:pb-24">
        <Eyebrow n="02" light>보상 약속</Eyebrow>
        <div className="mt-6 grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16 items-end">
          <h2 className="demo-in text-[40px] sm:text-[56px] lg:text-[88px] font-bold tracking-[-0.045em] leading-[1.02]">
            혜소보다
            <br />
            더 주면
            <br />
            <span className="text-[#ff8fab]">차액의 120%</span>
          </h2>
          <div className="demo-in" data-delay={120}>
            <p className="text-[17px] lg:text-[19px] leading-relaxed text-white/70">광고에 쓸 돈을 전부 고객에게 돌려드려요. 같은 통신사·상품·약정 조건으로 다른 곳 견적을 보여주시면, 차액의 120%를 사은품에 더해드려요.</p>
            <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-white/15 pt-6">
              {[['0', '광고비'], ['0', '중간 마진'], ['120%', '차액 보상']].map(([v, k]) => (
                <div key={k}>
                  <dt className="mono text-[11px] uppercase tracking-[0.08em] text-white/40">{k}</dt>
                  <dd className="mt-1.5 text-[28px] lg:text-[36px] font-semibold tracking-[-0.03em] tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4"><WonBand dark rows={5} /></div>
    </section>
  )
}

function Steps() {
  const steps = [
    { n: '01', t: '번호를 남겨요', d: '이름도 필요 없어요. 번호 하나면 돼요.' },
    { n: '02', t: '혜택연구소에서 전화 드려요', d: '조건을 비교하고 사은품 금액을 먼저 확정해요. 전화는 한 번이에요.' },
    { n: '03', t: '설치 후 현금으로 받아요', d: '설치가 확인되면 정해진 금액이 계좌로 들어가요.' },
  ]
  return (
    <section className="border-b border-[#e5e8eb]">
      <div className="max-w-[1180px] mx-auto px-6 lg:px-10 py-20 lg:py-32 grid lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-20">
        <div className="lg:sticky lg:top-24 self-start">
          <Eyebrow n="03">진행 방식</Eyebrow>
          <h2 className="demo-in mt-5 text-[32px] sm:text-[40px] lg:text-[56px] font-bold tracking-[-0.04em] leading-[1.1] text-[#111318]">세 단계면<br />끝나요</h2>
          <p className="demo-in mt-5 text-[16px] text-[#6b7684] max-w-[32ch]" data-delay={80}>가입을 강요하지 않아요. 조건이 맞을 때만 진행해요.</p>
        </div>
        <ol>
          {steps.map((s, i) => (
            <li key={s.n} className="demo-in grid grid-cols-[56px_1fr] lg:grid-cols-[96px_1fr] gap-4 py-8 lg:py-10 border-t border-[#e5e8eb] last:border-b" data-delay={i * 90}>
              <span className="mono text-[13px] text-[#ff8fab] pt-1.5">{s.n}</span>
              <div>
                <h3 className="text-[22px] lg:text-[28px] font-semibold tracking-[-0.03em] text-[#111318]">{s.t}</h3>
                <p className="mt-2 text-[15px] lg:text-[16px] leading-relaxed text-[#6b7684]">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Products({ products }: { products: DemoData['products'] }) {
  return (
    <section className="py-20 lg:py-32">
      <div className="max-w-[1180px] mx-auto px-6 lg:px-10 flex items-end justify-between gap-6 mb-8 lg:mb-12">
        <div>
          <Eyebrow n="04">가전렌탈</Eyebrow>
          <h2 className="demo-in mt-5 text-[32px] sm:text-[40px] lg:text-[56px] font-bold tracking-[-0.04em] leading-[1.1] text-[#111318]">요즘 많이 찾는 상품</h2>
        </div>
        <Link href="/electronics" className="hidden sm:inline-flex items-center gap-1 h-11 px-5 rounded-full border border-[#d1d6db] text-[14px] font-medium text-[#111318] hover:border-[#111318] transition-colors">전체 보기 <ArrowUpRight className="w-4 h-4" /></Link>
      </div>
      <div className="max-w-[1180px] mx-auto lg:px-10">
        <ul className="flex lg:grid lg:grid-cols-4 overflow-x-auto snap-x snap-mandatory px-6 lg:px-0 border-t border-[#e5e8eb] lg:border-l [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {products.map((p, i) => (
            <li key={p.slug} className="demo-in shrink-0 w-[240px] lg:w-auto snap-start border-r border-b border-[#e5e8eb] first:border-l lg:first:border-l-0" data-delay={i * 60}>
              <Link href={`/electronics/${p.categorySlug}/${p.slug}`} className="group block p-5 lg:p-6 h-full hover:bg-[#fafbfc] transition-colors">
                <Eyebrow>{p.brand} · {p.category}</Eyebrow>
                <div className="mt-5 aspect-[4/5] flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={p.name} className="max-h-full w-auto object-contain group-hover:scale-[1.04] transition-transform duration-700" loading="lazy" />
                </div>
                <p className="mt-5 text-[15px] font-medium text-[#111318] line-clamp-1">{p.name}</p>
                {p.fee && <p className="mono mt-1.5 text-[14px] text-[#6b7684] tabular-nums">월 {won(p.fee)}원 ~</p>}
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
    <section className="border-t border-[#e5e8eb]">
      <div className="max-w-[1180px] mx-auto px-6 lg:px-10 py-20 lg:py-32 grid lg:grid-cols-[1fr_auto] gap-10 items-end">
        <div>
          <Eyebrow n="05">혜소 파트너스</Eyebrow>
          <h2 className="demo-in mt-5 text-[32px] sm:text-[40px] lg:text-[56px] font-bold tracking-[-0.04em] leading-[1.1] text-[#111318]">블로그 글 하나로<br />시작하는 온라인 부업</h2>
          <p className="demo-in mt-5 text-[16px] lg:text-[18px] text-[#6b7684] max-w-[44ch]" data-delay={80}>내 링크로 들어온 상담은 자동으로 내 실적. 전화·접수·사은품 지급은 혜택연구소가 다 해요.</p>
        </div>
        <Link href="/partners/register" className="demo-in inline-flex items-center justify-center gap-2 h-[52px] px-6 rounded-full bg-[#111318] text-white text-[15px] font-medium hover:bg-[#2b2f36] transition-colors" data-delay={160}>
          파트너 신청하기 <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}

function FinalCta({ maxGift }: { maxGift: number }) {
  return (
    <section className="border-t border-[#e5e8eb]">
      <div className="max-w-[1180px] mx-auto px-6 lg:px-10 py-24 lg:py-40 text-center">
        <h2 className="demo-in text-[40px] sm:text-[56px] lg:text-[80px] font-bold tracking-[-0.045em] leading-[1.04] text-[#111318]">놓치고 있던 혜택,<br />지금 알아봐요</h2>
        <p className="demo-in mono mt-6 text-[12px] text-[#8b95a1]" data-delay={80}>인터넷 최대 {man(maxGift)} · 번호 하나면 돼요</p>
        <div className="demo-in mt-10" data-delay={160}>
          <Link href="/apply" className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-[#ff8fab] hover:bg-[#ff7096] text-white text-[16px] font-medium transition-colors">
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
    <div className="min-h-screen bg-white text-[#111318]" data-testid="demo-home">
      <Navbar />
      <Hero maxGift={data.maxGift} />
      <Report carriers={data.carriers} maxGift={data.maxGift} />
      <LogoGrid carriers={data.carriers} brands={data.brands} />
      <Services d={data} />
      <Promise />
      <Steps />
      <Products products={data.products} />
      <Partners />
      <FinalCta maxGift={data.maxGift} />
      <Footer />
    </div>
  )
}
