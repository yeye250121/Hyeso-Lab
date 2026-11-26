import { PROMISE_STORY as PROMISES } from '@/lib/content/promise'
import PhoneFrame, { PHONE_H } from './PhoneFrame'

// Promises 의 정적 버전(LazyMount fallback, 모션 없음). 서버에서 그려 SEO·no-JS 에서도 읽힌다.
// 실제 컴포넌트와 **높이를 똑같이** 맞춘다(데스크톱 300vh, 모바일 480svh 트랙 + sticky).
// 높이가 다르면 JS 가 늦게 붙는 순간 페이지가 수천 px 늘어나며 아래 섹션을 보던 사람의 화면이 튄다.
export default function PromisesStatic() {
  const first = PROMISES[0]
  return (
    <section id="promises" className="scroll-mt-16">
      <div className="hidden lg:block h-[300vh] max-w-[960px] mx-auto px-8">
        <div className="sticky top-0 h-screen grid grid-cols-[1fr_440px] gap-12 items-center">
          <ol className="space-y-8">
            {PROMISES.map((p, i) => (
              <li key={p.key} className={i === 0 ? 'opacity-100' : 'opacity-25'}>
                <p className="text-[12px] font-semibold text-[#ff5c8a] tabular-nums">0{i + 1}</p>
                <h3 className="mt-2 text-[28px] font-semibold tracking-[-0.02em] leading-[1.25] text-[#191f28] whitespace-pre-line">{p.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[#6b7684] max-w-[36ch]">{p.desc}</p>
              </li>
            ))}
          </ol>
          <div className="relative flex justify-center mt-24" style={{ height: PHONE_H }}><PhoneFrame>{null}</PhoneFrame></div>
        </div>
      </div>
      <div className="lg:hidden h-[480svh]">
        <div className="sticky top-[58px] h-[calc(100svh-58px)] px-5 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-5" aria-hidden>
            {PROMISES.map((p, i) => <span key={p.key} className={`h-1.5 rounded-full ${i === 0 ? 'w-7 bg-[#ff8fab]' : 'w-1.5 bg-[#e5e8eb]'}`} />)}
          </div>
          <div className="relative min-h-[150px]">
            <p className="text-[12px] font-semibold text-[#ff5c8a] tabular-nums">01</p>
            <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] leading-[1.3] text-[#191f28] whitespace-pre-line">{first.title}</h3>
            <p className="mt-3 text-[14px] leading-relaxed text-[#6b7684]">{first.desc}</p>
          </div>
          <div className="mt-5 flex justify-center [--phone-scale:0.72] sm:[--phone-scale:0.8]" style={{ height: PHONE_H * 0.72 }}><PhoneFrame>{null}</PhoneFrame></div>
        </div>
      </div>
      {/* 나머지 약속은 검색엔진·no-JS 용으로 숨겨 둔다 */}
      <ul className="sr-only">{PROMISES.slice(1).map((p) => <li key={p.key}>{p.title.replace('\n', ' ')} — {p.desc}</li>)}</ul>
    </section>
  )
}
