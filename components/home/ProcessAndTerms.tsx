import { ChevronDown } from 'lucide-react'
import { MATCH_TERMS, STEPS } from '@/lib/content/promise'
import Reveal from './Reveal'

// 4.5 진행 과정 + 120% 보상 규정 전문. 숨기지 않는 것이 신뢰 장치.
export default function ProcessAndTerms() {
  return (
    <section id="terms" className="scroll-mt-16 max-w-[1200px] mx-auto px-5 lg:px-8 pt-24 lg:pt-40">
      <Reveal>
        <p className="text-[12px] font-medium text-[#ff5c8a]">진행 과정</p>
        <h2 className="mt-3 text-[22px] lg:text-[32px] font-semibold tracking-[-0.02em] leading-[1.3] text-[#191f28] break-keep">속는 거 아닌지,<br className="lg:hidden" /> 순서대로 보여드릴게요</h2>
      </Reveal>
      <ol className="mt-10 lg:mt-14 grid md:grid-cols-3 gap-4 lg:gap-6">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} as="li" delay={i * 0.08} className="rounded-[24px] bg-[#f9fafb] p-6 lg:p-8">
            <p className="text-[12px] font-medium text-[#ff5c8a] tabular-nums">{s.n}</p>
            <h3 className="mt-3 text-[17px] lg:text-[18px] font-semibold tracking-[-0.01em] text-[#191f28] break-keep">{s.title}</h3>
            <p className="mt-2 text-[14px] lg:text-[15px] leading-relaxed text-[#6b7684] break-keep">{s.desc}</p>
          </Reveal>
        ))}
      </ol>

      <Reveal className="mt-6 lg:mt-8">
        <details className="group rounded-[24px] bg-[#f9fafb] px-6 lg:px-8" data-testid="terms-accordion">
          <summary className="flex items-center justify-between h-16 cursor-pointer list-none text-[15px] lg:text-[16px] font-semibold text-[#191f28]">
            120% 보상 규정 전문
            <ChevronDown className="w-5 h-5 text-[#8b95a1] transition-transform group-open:rotate-180" />
          </summary>
          <div className="pb-7 grid md:grid-cols-3 gap-6 text-[14px] leading-relaxed text-[#4e5968]">
            {[['적용 조건', MATCH_TERMS.apply], ['제외 조건', MATCH_TERMS.exclude], ['신청 방법', MATCH_TERMS.how]].map(([t, list]) => (
              <div key={t as string}>
                <p className="font-semibold text-[#191f28]">{t as string}</p>
                <ul className="mt-2 space-y-1.5 list-disc pl-4">{(list as readonly string[]).map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            ))}
          </div>
        </details>
      </Reveal>
    </section>
  )
}
