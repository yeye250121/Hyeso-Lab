import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'
import { deliverStatement } from '@/lib/admin/statementLinks'
import { buildApplicationStatement, buildLeadStatement } from '@/lib/admin/statement'

// 상담 신청 → 명세서 텍스트. 신청서가 이미 작성돼 있으면 더 자세한 신청서 명세서를 준다.
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = requireAdmin(request)
  if (!admin) return unauthorizedResponse()

  try {
    const db = getSupabaseAdmin()
    const { data: lead, error } = await db.from('leads').select('*').eq('id', params.id).maybeSingle()
    if (error) throw error
    if (!lead) return NextResponse.json({ error: '상담 신청을 찾을 수 없습니다.' }, { status: 404 })

    if (lead.application_id) {
      const { data: app } = await db
        .from('electronics_applications')
        .select('*')
        .eq('id', lead.application_id)
        .maybeSingle()
      if (app) {
        console.info(`[Admin] 명세서 생성: application=${app.id} (lead=${lead.id}) admin=${admin.loginId}`)
        return NextResponse.json({ text: buildApplicationStatement(app), sentAt: lead.statement_sent_at, source: 'application' })
      }
    }

    console.info(`[Admin] 명세서 생성: lead=${lead.id} admin=${admin.loginId}`)
    return NextResponse.json({ text: buildLeadStatement(lead), sentAt: lead.statement_sent_at, source: 'lead' })
  } catch (error) {
    return routeError('Admin Lead Statement', error, '명세서를 만들지 못했습니다.')
  }
}

const KIND = 'lead' as const
const TABLE = 'leads'
const STATUS_ADVANCE = false

const sendSchema = z.object({
  giftAmount: z.number().int().min(0).max(5_000_000).nullable().optional(),
  send: z.boolean().optional().default(false),
})

// 전달 처리. send=true 면 사은품 저장 → 담당자 전용 링크 생성 → 담당자 알림톡 → 전달 시각 기록.
// send=false 면 사람이 카톡으로 직접 보낸 뒤 전달 완료만 표시한다.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = requireAdmin(request)
  if (!admin) return unauthorizedResponse()

  const parsed = sendSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: '올바르지 않은 값입니다.' }, { status: 400 })

  try {
    if (parsed.data.send) {
      console.info(`[Admin] 담당자 명세서 전송: ${KIND}=${params.id} admin=${admin.loginId}`)
      const result = await deliverStatement({ kind: KIND, refId: params.id, adminId: admin.id, giftAmount: parsed.data.giftAmount })
      if (!result) return NextResponse.json({ error: '대상을 찾을 수 없습니다.' }, { status: 404 })
      return NextResponse.json({ ok: true, ...result })
    }

    const db = getSupabaseAdmin()
    const sentAt = new Date().toISOString()
    const patch: Record<string, unknown> = { statement_sent_at: sentAt }
    if (parsed.data.giftAmount !== undefined) patch.gift_amount = parsed.data.giftAmount
    const { data, error } = await db.from(TABLE).update(patch).eq('id', params.id).select('id, status').maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: '대상을 찾을 수 없습니다.' }, { status: 404 })
    let status = data.status as string
    if (STATUS_ADVANCE && status === 'new') {
      status = 'in_progress'
      await db.from(TABLE).update({ status }).eq('id', params.id)
    }
    return NextResponse.json({ ok: true, sentAt, status })
  } catch (error) {
    return routeError('Admin Statement Sent', error, '전달 기록을 남기지 못했습니다.')
  }
}
