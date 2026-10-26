import { getSupabaseAdmin } from '@/lib/supabase-admin'

// 방문 집계 조회. DB 함수(traffic_daily / traffic_top)를 부르고, 빈 날짜는 0으로 채워 돌려준다.
export type TrafficPoint = { day: string; label: string; pageviews: number; visitors: number }
export type TrafficTop = { key: string; pageviews: number; visitors: number }

function kstDate(d: Date): string {
  return new Date(d.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10)
}

export function rangeDays(days: number) {
  const now = new Date()
  const kst = new Date(now.getTime() + 9 * 3600 * 1000)
  const todayStart = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) - 9 * 3600 * 1000)
  const from = new Date(todayStart.getTime() - (days - 1) * 24 * 3600 * 1000)
  const to = new Date(todayStart.getTime() + 24 * 3600 * 1000)
  return { from, to, todayStart }
}

export type Range = { from: Date; to: Date }

/** YYYY-MM-DD(한국 날짜) 두 개 → 시작일 0시 ~ 종료일 다음날 0시(UTC 기준 Date). 잘못된 값이면 null */
export function rangeFromDates(fromStr: string, toStr: string): Range | null {
  const re = /^\d{4}-\d{2}-\d{2}$/
  if (!re.test(fromStr) || !re.test(toStr)) return null
  const from = new Date(`${fromStr}T00:00:00+09:00`)
  const to = new Date(`${toStr}T00:00:00+09:00`)
  if (isNaN(from.getTime()) || isNaN(to.getTime()) || to < from) return null
  return { from, to: new Date(to.getTime() + 24 * 3600 * 1000) }
}

function resolveRange(r: number | Range): Range {
  return typeof r === 'number' ? rangeDays(r) : r
}

export async function trafficDaily(range: number | Range, code: string | null = null): Promise<TrafficPoint[]> {
  const { from, to } = resolveRange(range)
  const days = Math.round((to.getTime() - from.getTime()) / (24 * 3600 * 1000))
  const { data, error } = await getSupabaseAdmin().rpc('traffic_daily', { p_from: from.toISOString(), p_to: to.toISOString(), p_code: code })
  if (error) throw error
  const byDay = new Map<string, { pageviews: number; visitors: number }>()
  for (const r of (data ?? []) as { day: string; pageviews: number; visitors: number }[]) byDay.set(r.day, { pageviews: Number(r.pageviews), visitors: Number(r.visitors) })
  const out: TrafficPoint[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(from.getTime() + i * 24 * 3600 * 1000)
    const key = kstDate(d)
    const v = byDay.get(key) ?? { pageviews: 0, visitors: 0 }
    out.push({ day: key, label: `${Number(key.slice(5, 7))}/${Number(key.slice(8, 10))}`, ...v })
  }
  return out
}

export async function trafficTop(range: number | Range, dim: 'path' | 'referrer' | 'partner' | 'utm_source' | 'device', limit = 10, code: string | null = null): Promise<TrafficTop[]> {
  const { from, to } = resolveRange(range)
  const { data, error } = await getSupabaseAdmin().rpc('traffic_top', { p_from: from.toISOString(), p_to: to.toISOString(), p_dim: dim, p_limit: limit, p_code: code })
  if (error) throw error
  return ((data ?? []) as { key: string; pageviews: number; visitors: number }[]).map((r) => ({ key: r.key, pageviews: Number(r.pageviews), visitors: Number(r.visitors) }))
}
