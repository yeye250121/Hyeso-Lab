import { PROMISES } from '@/lib/content/promise'

// Promises 의 정적 버전(모션 없음). LazyMount 의 fallback 으로 서버에서 그려져 SEO·no-JS 에서도 읽힌다.
export default function PromisesStatic() {
  return (
    <section id="promises" className="scroll-mt-16 max-w-[1200px] mx-auto px-5 lg:px-8 pt-24 lg:pt-40">
      <p className="text-[13px] font-semibold text-[#ff5c8a]">세 가지 약속</p>
      <h2 className="mt-3 text-[28px] lg:text-[48px] font-bold tracking-[-0.03em] leading-[1.2] text-[#191f28] break-keep">그래서 나한테 뭘 보장하나요?</h2>
      <ol className="mt-10 grid lg:grid-cols-3 gap-6">
        {PROMISES.map((p, i) => (
          <li key={p.key} className="rounded-[20px] bg-[#f9fafb] p-6 lg:p-8">
            <p className="text-[12px] font-semibold text-[#ff5c8a]">0{i + 1}</p>
            <h3 className="mt-2 text-[24px] font-bold tracking-[-0.03em] leading-[1.2] text-[#191f28] whitespace-pre-line">{p.title}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[#6b7684]">{p.desc}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
