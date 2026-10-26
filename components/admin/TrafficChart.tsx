'use client'

// 일별 막대 차트. 방문자(진한 막대) 위에 페이지뷰(연한 막대)를 겹치고, 선택적으로 접수 건수를 점으로 찍는다.
// 30일·90일을 모바일 폭에서도 그리기 위해 SVG 로 그린다.
export type ChartPoint = { day: string; label: string; visitors: number; pageviews: number; leads?: number }

export default function TrafficChart({ data, height = 140, showLeads = false }: { data: ChartPoint[]; height?: number; showLeads?: boolean }) {
  const W = 600
  const H = height
  const padB = 18
  const n = Math.max(1, data.length)
  const maxPv = Math.max(1, ...data.map((d) => d.pageviews))
  const slot = W / n
  const bw = Math.max(2, slot * 0.62)
  const y = (v: number) => H - padB - (v / maxPv) * (H - padB - 10)
  const labelEvery = n > 45 ? 15 : n > 14 ? 5 : 1
  const empty = data.every((d) => d.pageviews === 0)

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="일별 방문 추이">
        {[0.5, 1].map((f) => (
          <line key={f} x1={0} x2={W} y1={y(maxPv * f)} y2={y(maxPv * f)} stroke="#f2f4f6" strokeWidth={1} />
        ))}
        {data.map((d, i) => {
          const x = i * slot + (slot - bw) / 2
          return (
            <g key={d.day}>
              <title>{`${d.label} · 방문자 ${d.visitors} · 페이지뷰 ${d.pageviews}${showLeads ? ` · 접수 ${d.leads ?? 0}` : ''}`}</title>
              <rect x={x} y={y(d.pageviews)} width={bw} height={Math.max(0, H - padB - y(d.pageviews))} rx={2} fill="#ffd1dd" />
              <rect x={x} y={y(d.visitors)} width={bw} height={Math.max(0, H - padB - y(d.visitors))} rx={2} fill="#ff8fab" />
              {showLeads && (d.leads ?? 0) > 0 && <circle cx={x + bw / 2} cy={Math.min(y(d.visitors) - 6, H - padB - 6)} r={3} fill="#191f28" />}
              {i % labelEvery === 0 && (
                <text x={x + bw / 2} y={H - 4} textAnchor="middle" fontSize={10} fill="#b0b8c1">{d.label}</text>
              )}
            </g>
          )
        })}
      </svg>
      {empty && <p className="absolute inset-0 flex items-center justify-center text-[12px] text-text-tertiary">아직 방문 기록이 없어요</p>}
      <div className="mt-1 flex items-center gap-3 text-[11px] text-text-tertiary">
        <span className="inline-flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-[3px] bg-[#ff8fab]" /> 방문자</span>
        <span className="inline-flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-[3px] bg-[#ffd1dd]" /> 페이지뷰</span>
        {showLeads && <span className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-[#191f28]" /> 접수</span>}
      </div>
    </div>
  )
}
