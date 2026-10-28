import type { Metadata } from 'next'
import SiteHeader from '@/components/home/SiteHeader'
import Hero from '@/components/home/Hero'
import { PromisesLazy, HowPossibleLazy, CaseMarqueeLazy } from '@/components/home/LazySections'
import TwoThings from '@/components/home/TwoThings'
import ProcessAndTerms from '@/components/home/ProcessAndTerms'
import Faq from '@/components/home/Faq'
import FinalCta, { MobileCtaBar } from '@/components/home/FinalCta'
import Footer from '@/components/shared/Footer'
import { getHomeCatalog } from '@/lib/content/catalog'

// 메인 리뉴얼 데모(/demo). 메인(/)은 그대로. 섹션 순서 = 의심을 하나씩 해소하는 흐름.
export const revalidate = 600

export const metadata: Metadata = {
  title: '인터넷 가입 사은품 · 가전렌탈 지원금 | 혜택연구소',
  description: '광고 모델 대신 그 돈을 사은품으로. 인터넷·TV 최대 지원금과 가전렌탈 552종 비교, 다른 곳이 더 주면 차액의 120% 보상, 설치 당일 현금 지급.',
  openGraph: { title: '놓치고 있던 혜택, 대신 알아볼게요 | 혜택연구소', description: '광고 모델 대신, 그 돈을 사은품으로 드려요. 차액 120% 보상 · 설치 당일 현금 · 권유 없음', url: 'https://www.hyeso.kr/', siteName: '혜택연구소', images: [{ url: '/og-home.png', width: 1200, height: 630 }], locale: 'ko_KR', type: 'website' },
  robots: { index: false },
}

const FOOTER_LINKS = [
  { title: '서비스', links: [{ text: '인터넷·TV 혜택', href: '/internet' }, { text: '가전렌탈 혜택', href: '/electronics' }] },
  { title: '문의', links: [{ text: '상담 신청', href: '/apply' }, { text: '파트너스', href: '/partners/register' }] },
]

export default async function DemoPage() {
  const d = await getHomeCatalog()
  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '혜택연구소',
    alternateName: '혜소',
    url: 'https://www.hyeso.kr',
    logo: 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/public/HYESO-LAB/logos/hyeso-mark.png',
    telephone: '+82-10-7469-4385',
    address: { '@type': 'PostalAddress', addressLocality: '창원시 진해구', addressRegion: '경상남도', streetAddress: '충장로 68-1, 2층 1호', addressCountry: 'KR' },
  }
  return (
    <div className="min-h-screen bg-white text-[#191f28]" data-testid="demo-home">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      <SiteHeader />
      <main>
        <Hero maxGift={d.maxGift} />
        <PromisesLazy />
        <HowPossibleLazy />
        <TwoThings maxGift={d.maxGift} carriers={d.carriers} productCount={d.productCount} brands={d.brands} />
        <ProcessAndTerms />
        {d.cases.length > 0 && <CaseMarqueeLazy cases={d.cases} className="mt-24 lg:mt-40" />}
        <Faq />
        <FinalCta />
      </main>
      <div className="pb-20 lg:pb-0"><Footer linkSections={FOOTER_LINKS} /></div>
      <MobileCtaBar />
    </div>
  )
}
