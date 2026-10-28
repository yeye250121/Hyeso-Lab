'use client'


// 히어로 시그니처: '광고비' 블록이 줄어들고 그 돈이 '내 사은품'으로 흘러 들어간다. 약 4초(사용자 요청으로 2배 느리게).
// 히어로는 첫 화면이라 framer-motion 없이 SVG + CSS 키프레임으로 그린다(초기 JS 를 줄여 LCP·TBT 를 지킨다).
// reduced-motion 이면 CSS 에서 최종 상태로 고정된다(globals.css .mf-*).
export default function MoneyFlow() {
  const W = 520, H = 300, base = 262
  return (
    <div className="relative w-full max-w-[520px] mx-auto mf" aria-label="광고비를 쓰지 않고 그 돈을 사은품으로 드리는 구조">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <line x1={40} x2={W - 40} y1={base} y2={base} stroke="#e5e8eb" strokeWidth={1} />
        {/* 다른 곳: 광고비·마진이 줄어든다 (transform-origin 아래) */}
        <g className="mf-ad" style={{ transformOrigin: `140px ${base - 130}px` }}><rect x={80} y={base - 220} width={120} height={90} rx={10} fill="#e5e8eb" /><text x={140} y={base - 170} textAnchor="middle" fontSize={13} fill="#6b7684" fontWeight={500}>광고비</text></g>
        <g className="mf-margin" style={{ transformOrigin: `140px ${base - 80}px` }}><rect x={80} y={base - 130} width={120} height={50} rx={10} fill="#eceef1" /><text x={140} y={base - 100} textAnchor="middle" fontSize={13} fill="#6b7684" fontWeight={500}>중간 마진</text></g>
        <rect x={80} y={base - 80} width={120} height={80} rx={10} fill="#b0b8c1" />
        <text x={140} y={base - 34} textAnchor="middle" fontSize={13} fill="#fff" fontWeight={600}>사은품</text>
        <text x={140} y={base + 22} textAnchor="middle" fontSize={12} fill="#6b7684">다른 곳</text>
        {/* 흘러가는 동전 */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <circle key={i} className="mf-coin" r={6} fill="#ff8fab" cx={140} cy={base - 200 + i * 14} style={{ animationDelay: `${1 + i * 0.24}s` }} />
        ))}
        {/* 혜택연구소: 사은품이 커진다 */}
        <g className="mf-ours" style={{ transformOrigin: `380px ${base}px` }}><rect x={320} y={base - 220} width={120} height={220} rx={10} fill="#ff8fab" /></g>
        <text x={380} y={base - 34} textAnchor="middle" fontSize={13} fill="#191f28" fontWeight={600}>사은품</text>
        <text x={380} y={base + 22} textAnchor="middle" fontSize={12} fill="#191f28" fontWeight={600}>혜택연구소</text>
      </svg>
    </div>
  )
}
