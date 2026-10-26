'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/admin/api'
import TrafficChart, { type ChartPoint } from '@/components/admin/TrafficChart'

// 대시보드 방문 추이 패널(대표자·관리자). 방문자·페이지뷰 추이 + 인기 페이지·유입처·파트너 링크 유입.
type Top = { key: string; pageviews: number; visitors: number; name?: string }
type Data = { days: number; daily: ChartPoint[]; today: ChartPoint; totals: { pageviews: number; visitors: number }; paths: Top[]; referrers: Top[]; devices: Top[]; partners: Top[] }

export default function TrafficPanel() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    setData(null)
    api.get(`/admin/traffic?days=${days}`).then((r) => setData(r.data)).catch(() => setError(true))
  }, [days])

  const mobile = data?.devices.find((d) => d.key === 'mobile')?.pageviews ?? 0
  const mobileShare = data && data.totals.pageviews ? Math.round((mobile / data.totals.pageviews) * 100) : null

  return (
    <section className="bg-bg-card rounded-card p-5 md:p-6" data-testid="traffic-panel">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-title text-text-primary">방문 추이</h2>
        <div className="flex gap-1 rounded-button bg-bg-primary p-0.5">
          {[30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)} className={`px-2.5 h-7 rounded-md text-[12px] font-medium ${days === d ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-secondary'}`} data-testid={`traffic-days-${d}`}>
              {d}일
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 text-small text-text-secondary">방문 추이를 불러오지 못했어요.</p>}
      {!data && !error && <div className="mt-4 h-[180px] rounded-xl bg-bg-primary animate-pulse" />}
      {data && (
        <>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="오늘 방문자" value={data.today?.visitors ?? 0} sub={`페이지뷰 ${data.today?.pageviews ?? 0}`} />
            <Stat label={`${data.days}일 방문자`} value={data.totals.visitors} sub={`페이지뷰 ${data.totals.pageviews.toLocaleString()}`} />
            <Stat label="모바일 비중" value={mobileShare === null ? '-' : `${mobileShare}%`} sub="페이지뷰 기준" />
          </div>
          <div className="mt-4">
            <TrafficChart data={data.daily} />
          </div>
          <div className="mt-5 grid md:grid-cols-3 gap-4">
            <TopList title="많이 본 페이지" rows={data.paths} />
            <TopList title="유입처" rows={data.referrers.map((r) => ({ ...r, key: r.key === '(없음)' ? '직접 접속 · 앱' : r.key }))} />
            <TopList title="파트너 링크 유입" rows={data.partners.map((p) => ({ ...p, key: p.name ?? p.key }))} empty="파트너 링크로 들어온 방문이 아직 없어요" />
          </div>
        </>
      )}
    </section>
  )
}

function Stat({ label, value, sub }: { label: string; value: number | string; sub: string }) {
  return (
    <div className="rounded-xl bg-bg-primary px-3 py-2.5 min-w-0">
      <p className="text-[11px] text-text-secondary truncate">{label}</p>
      <p className="mt-0.5 text-[20px] font-bold text-text-primary tabular-nums leading-tight">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-[11px] text-text-tertiary truncate">{sub}</p>
    </div>
  )
}

function TopList({ title, rows, empty = '아직 기록이 없어요' }: { title: string; rows: Top[]; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.pageviews))
  return (
    <div>
      <p className="text-[13px] font-semibold text-text-primary">{title}</p>
      {rows.length === 0 ? (
        <p className="mt-2 text-[12px] text-text-tertiary">{empty}</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {rows.map((r) => (
            <li key={r.key} className="relative overflow-hidden rounded-md">
              <span className="absolute inset-y-0 left-0 bg-[#fff1f5]" style={{ width: `${(r.pageviews / max) * 100}%` }} />
              <span className="relative flex items-center justify-between gap-2 px-2 py-1 text-[12px]">
                <span className="truncate text-text-primary">{r.key}</span>
                <span className="shrink-0 tabular-nums text-text-secondary">{r.visitors.toLocaleString()}<span className="text-text-tertiary"> / {r.pageviews.toLocaleString()}</span></span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
