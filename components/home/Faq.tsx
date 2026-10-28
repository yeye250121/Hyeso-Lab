import { ChevronDown } from 'lucide-react'
import { FAQ } from '@/lib/content/promise'
import Reveal from './Reveal'

// 4.7 FAQ + FAQPage JSON-LD
export default function Faq() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }
  return (
    <section className="max-w-[1200px] mx-auto px-5 lg:px-8 pt-24 lg:pt-40">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="grid lg:grid-cols-[1fr_2fr] gap-8 lg:gap-16">
        <Reveal>
          <p className="text-[12px] font-medium text-[#ff5c8a]">자주 묻는 질문</p>
          <h2 className="mt-3 text-[22px] lg:text-[30px] font-semibold tracking-[-0.02em] leading-[1.3] text-[#191f28]">마지막으로<br />궁금한 것들</h2>
        </Reveal>
        <Reveal as="div" className="divide-y divide-[#e5e8eb] border-y border-[#e5e8eb]">
          {FAQ.map((f) => (
            <details key={f.q} className="group">
              <summary className="flex items-center justify-between gap-4 py-5 cursor-pointer list-none text-[15px] lg:text-[16px] font-medium text-[#191f28]">
                {f.q}
                <ChevronDown className="w-5 h-5 shrink-0 text-[#8b95a1] transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-5 text-[15px] leading-relaxed text-[#6b7684] break-keep">{f.a}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
