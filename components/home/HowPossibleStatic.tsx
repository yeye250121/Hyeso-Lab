// HowPossible 의 정적 버전(LazyMount fallback). 실제 컴포넌트와 같은 레이아웃·높이로, 막대는 최종 상태로 그린다.
// 높이가 다르면 JS 가 붙는 순간 약 400px 늘어나 아래가 밀린다.
export default function HowPossibleStatic() {
  return (
    <section className="bg-[#191f28] text-white mt-24 lg:mt-40">
      <div className="max-w-[960px] mx-auto px-5 lg:px-8 py-24 lg:py-40 grid lg:grid-cols-[1fr_440px] gap-12 lg:gap-12 items-center">
        <div>
          <p className="text-[12px] font-medium text-[#ff9fb8]">어떻게 가능할까요?</p>
          <h2 className="mt-3 text-[22px] lg:text-[32px] font-semibold tracking-[-0.02em] leading-[1.3] break-keep">광고 모델을 쓰지 않아요</h2>
          <p className="mt-5 text-[15px] lg:text-[16px] leading-relaxed text-white/70 max-w-[40ch] break-keep">광고에 쓸 돈을 전부 고객에게 돌려드려요. 월 요금은 어디서 가입해도 같아요. 다른 건 사은품뿐이에요.</p>
        </div>
        <div className="rounded-[24px] bg-white/[0.06] ring-1 ring-white/10 p-6 lg:p-8">
          <div className="grid grid-cols-2 gap-8 items-end h-[280px]">
            <div className="flex flex-col justify-end gap-1.5 h-full">
              <div className="h-[80px] rounded-xl bg-white/25 flex items-center justify-center text-[13px] font-medium">사은품</div>
            </div>
            <div className="flex flex-col justify-end h-full">
              <div className="h-[232px] rounded-xl bg-[#ff8fab] text-[#191f28] flex items-center justify-center text-[14px] font-semibold">사은품</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-8 text-center text-[13px]"><span className="text-white/75">다른 곳</span><span className="font-semibold">혜택연구소</span></div>
        </div>
      </div>
    </section>
  )
}
