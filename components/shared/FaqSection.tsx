import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import type { FaqItem } from '@/lib/content/rentalFaq'

// 펼침식 FAQ + FAQPage JSON-LD. 메인 FAQ(components/home/Faq.tsx)와 같은 모양이고, 답변 아래에 바로 누를 링크를 둘 수 있다.
export default function FaqSection({ title = '자주 묻는 질문', items, className = '' }: { title?: string; items: FaqItem[]; className?: string }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }
  return (
    <section className={className} data-testid="faq-section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h2 className="text-xl font-bold text-[#333d4b] mb-3">{title}</h2>
      <div className="divide-y divide-[#e5e8eb] border-y border-[#e5e8eb]">
        {items.map((f) => (
          <details key={f.q} className="group">
            <summary className="flex items-center justify-between gap-4 py-5 cursor-pointer list-none text-[15px] lg:text-[16px] font-medium text-[#191f28] break-keep">
              {f.q}
              <ChevronDown className="w-5 h-5 shrink-0 text-[#8b95a1] transition-transform group-open:rotate-180" />
            </summary>
            <div className="pb-5">
              <p className="text-[15px] leading-relaxed text-[#6b7684] break-keep">{f.a}</p>
              {f.links && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {f.links.map((l) =>
                    l.href.startsWith('/') ? (
                      <Link key={l.href} href={l.href} className="inline-flex items-center h-9 px-3.5 rounded-full bg-[#f2f4f6] text-[13px] font-medium text-[#333d4b] hover:bg-[#e5e8eb]">{l.label}</Link>
                    ) : (
                      <a key={l.href} href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel={l.href.startsWith('http') ? 'noopener noreferrer' : undefined} className="inline-flex items-center h-9 px-3.5 rounded-full bg-[#f2f4f6] text-[13px] font-medium text-[#333d4b] hover:bg-[#e5e8eb]">{l.label}</a>
                    )
                  )}
                </div>
              )}
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
