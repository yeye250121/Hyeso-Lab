'use client'

import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import api from '@/lib/admin/api'
import TrafficChart, { type ChartPoint } from '@/components/admin/TrafficChart'

// 대시보드 방문 추이 패널(대표자·관리자). 방문자·페이지뷰 추이 + 인기 페이지·유입처·파트너 링크 유입.
type Top = { key: string; pageviews: number; visitors: number; name?: string }
type Data = { days: number; daily: ChartPoint[]; today: ChartPoint; totals: { pageviews: number; visitors: number }; paths: Top[]; referrers: Top[]; devices: Top[]; partners: Top[] }

export default function TrafficPanel() {
  const [open, setOpen] = useState(false) // 접힌 채로 시작. 펼칠 때 데이터를 받는다
  const [range, setRange] = useState(() => preset(30))
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!open) return
    setData(null)
    setError(false)
    api.get(`/admin/traffic?from=${range.from}&to=${range.to}`).then((r) => setData(r.data)).catch(() => setError(true))
  }, [range, open])
  const activePreset = PRESETS.find((p) => { const r = p.range(); return r.from === range.from && r.to === range.to })?.label ?? null

  const mobile = data?.devices.find((d) => d.key === 'mobile')?.pageviews ?? 0
  const mobileShare = data && data.totals.pageviews ? Math.round((mobile / data.totals.pageviews) * 100) : null

  return (
    <section className="bg-bg-card rounded-card" data-testid="traffic-panel" data-open={open ? '1' : '0'}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} data-testid="traffic-toggle" className="w-full flex items-center justify-between gap-3 px-5 md:px-6 py-4 md:py-5 text-left">
        <span>
          <span className="text-title text-text-primary">방문 추이</span>
          <span className="ml-2 text-small text-text-tertiary">{open ? '' : '눌러서 펼치기'}</span>
        </span>
        <ChevronDown className={`w-5 h-5 text-text-tertiary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
      <div className="px-5 md:px-6 pb-5 md:pb-6">
      {/* 조회 기간: 달력 두 개 + 빠른 선택 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-button bg-bg-primary px-2 h-9">
          <input type="date" value={range.from} max={range.to} onChange={(e) => e.target.value && setRange((r) => ({ ...r, from: e.target.value }))} className="bg-transparent text-[13px] text-text-primary outline-none w-[118px]" data-testid="traffic-from" aria-label="시작일" />
          <span className="text-text-tertiary text-[12px]">~</span>
          <input type="date" value={range.to} min={range.from} max={kstToday()} onChange={(e) => e.target.value && setRange((r) => ({ ...r, to: e.target.value }))} className="bg-transparent text-[13px] text-text-primary outline-none w-[118px]" data-testid="traffic-to" aria-label="종료일" />
        </div>
        <div className="flex gap-1">
          {PRESETS.map((p) => (
            <button key={p.label} type="button" onClick={() => setRange(p.range())} className={`px-2.5 h-7 rounded-full text-[12px] font-medium ${activePreset === p.label ? 'bg-text-primary text-bg-card' : 'bg-bg-primary text-text-secondary hover:text-text-primary'}`} data-testid={`traffic-preset-${p.label}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 text-small text-text-secondary">방문 추이를 불러오지 못했어요.</p>}
      {!data && !error && <div className="mt-3 h-[180px] rounded-xl bg-bg-primary animate-pulse" />}
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
      </div>
      )}
    </section>
  )
}

// 한국 날짜 문자열(YYYY-MM-DD)
function kstToday(offsetDays = 0): string {
  return new Date(Date.now() + 9 * 3600 * 1000 + offsetDays * 24 * 3600 * 1000).toISOString().slice(0, 10)
}
function preset(days: number) {
  return { from: kstToday(-(days - 1)), to: kstToday() }
}
const PRESETS: { label: string; range: () => { from: string; to: string } }[] = [
  { label: '7일', range: () => preset(7) },
  { label: '30일', range: () => preset(30) },
  { label: '90일', range: () => preset(90) },
  { label: '이번 달', range: () => ({ from: `${kstToday().slice(0, 7)}-01`, to: kstToday() }) },
]

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
