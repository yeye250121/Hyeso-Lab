import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// 방문 기록 수집. 브라우저가 페이지를 옮길 때마다 한 번 보낸다(PageViewTracker).
// 개인정보는 받지 않는다. 방문자 구분용 무작위 쿠키(hl_v, 1년)만 심는다.
export const dynamic = 'force-dynamic'

const schema = z.object({
  path: z.string().min(1).max(300),
  referrer: z.string().max(500).optional().nullable(),
  utm: z.object({ source: z.string().max(80).optional(), medium: z.string().max(80).optional(), campaign: z.string().max(120).optional() }).optional(),
  marketerCode: z.string().max(40).optional().nullable(),
})

const INTERNAL = /^\/(owner|admin|partners|s|api|_next)(\/|$)/
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pingdom|facebookexternalhit|preview/i

function hostOf(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const ua = request.headers.get('user-agent') ?? ''
  if (BOT.test(ua)) return NextResponse.json({ ok: true, skipped: 'bot' })
  const body = schema.safeParse(await request.json().catch(() => null))
  if (!body.success) return NextResponse.json({ ok: false }, { status: 400 })
  const v = body.data
  const path = v.path.split('?')[0].slice(0, 300)
  if (INTERNAL.test(path)) return NextResponse.json({ ok: true, skipped: 'internal' })

  const own = request.nextUrl.hostname.replace(/^www\./, '')
  const refHost = hostOf(v.referrer)
  const referrer = refHost && refHost !== own ? refHost : null

  let visitor = request.cookies.get('hl_v')?.value ?? null
  let isNew = false
  if (!visitor || !/^[A-Za-z0-9_-]{8,40}$/.test(visitor)) {
    visitor = crypto.randomUUID().replace(/-/g, '').slice(0, 24)
    isNew = true
  }
  const device = /Mobi|Android|iPhone|iPad/i.test(ua) ? 'mobile' : 'desktop'

  // 파트너 코드는 /m/<코드> 경로가 우선, 없으면 클라이언트가 보낸 쿠키 값
  const fromPath = path.match(/^\/m\/([^/]+)/)?.[1] ?? null
  const marketerCode = (fromPath ?? v.marketerCode ?? null)?.slice(0, 40) ?? null

  try {
    await getSupabaseAdmin().from('page_views').insert({
      path,
      referrer_host: referrer,
      utm_source: v.utm?.source ?? null,
      utm_medium: v.utm?.medium ?? null,
      utm_campaign: v.utm?.campaign ?? null,
      marketer_code: marketerCode || null,
      visitor,
      device,
      is_new: isNew,
    })
  } catch (e) {
    console.error('[pv] insert failed:', e instanceof Error ? e.message : e)
  }
  const res = NextResponse.json({ ok: true })
  if (isNew) res.cookies.set('hl_v', visitor, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  return res
}
