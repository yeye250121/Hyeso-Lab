import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import Reveal from './Reveal'

// 4.4 딱 두 가지만 — 인터넷·TV / 가전렌탈. 많이 하지 않는 대신 깊게.
const ICON = 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/public/HYESO-LAB/icons'
const man = (n: number) => (n % 10000 === 0 ? `${n / 10000}만원` : `${n.toLocaleString('ko-KR')}원`)

export default function TwoThings({ maxGift, carriers, productCount, brands }: { maxGift: number; carriers: string[]; productCount: number; brands: string[] }) {
  const cards = [
    { href: '/internet', icon: `${ICON}/internet_icon.png`, title: '인터넷 · TV', big: `최대 ${man(maxGift)}`, sub: '현금 사은품 · 통신사만 고르면 바로 계산', list: carriers, listLabel: `통신사 ${carriers.length}곳` },
    { href: '/electronics', icon: `${ICON}/electronics_icon.png`, title: '가전렌탈', big: `${productCount.toLocaleString('ko-KR')}종 비교`, sub: '사은품 금액은 상담 때 먼저 확정해 알려드려요', list: brands, listLabel: `브랜드 ${brands.length}곳` },
  ]
  return (
    <section className="max-w-[1200px] mx-auto px-5 lg:px-8 pt-24 lg:pt-40">
      <Reveal>
        <p className="text-[12px] font-medium text-[#ff5c8a]">딱 두 가지</p>
        <h2 className="mt-3 text-[22px] lg:text-[32px] font-semibold tracking-[-0.02em] leading-[1.3] text-[#191f28] break-keep">많이 하지 않아요.<br />두 가지만 깊게 해요.</h2>
      </Reveal>
      <div className="mt-10 lg:mt-14 grid md:grid-cols-2 gap-4 lg:gap-6">
        {cards.map((c, i) => (
          <Reveal key={c.href} delay={i * 0.08}>
            <Link href={c.href} className="group block h-full rounded-[24px] bg-[#f9fafb] hover:bg-[#f2f4f6] transition-colors p-6 lg:p-9">
              <div className="flex items-start justify-between">
                <Image src={c.icon} alt="" width={96} height={96} className="w-14 h-14 lg:w-16 lg:h-16" />
                <span className="inline-flex items-center gap-1 text-[14px] font-medium text-[#4e5968] group-hover:text-[#191f28]">자세히 보기 <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></span>
              </div>
              <h3 className="mt-6 text-[18px] lg:text-[20px] font-semibold tracking-[-0.01em] text-[#191f28]">{c.title}</h3>
              <p className="mt-1 text-[22px] lg:text-[26px] font-semibold tracking-[-0.02em] text-[#ff5c8a] tabular-nums">{c.big}</p>
              <p className="mt-2 text-[14px] text-[#6b7684]">{c.sub}</p>
              <p className="mt-6 text-[12px] font-medium text-[#8b95a1]">{c.listLabel}</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {c.list.map((n) => <li key={n} className="h-7 px-2.5 inline-flex items-center rounded-full bg-white text-[12px] text-[#4e5968] ring-1 ring-[#e5e8eb]">{n}</li>)}
              </ul>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
