import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'
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

// 상위 업체에 전달했음을 기록한다. 아직 신규 상태면 연락완료 전 단계 표시를 위해 그대로 두고 시각만 남긴다.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!requireAdmin(request)) return unauthorizedResponse()

  try {
    const sentAt = new Date().toISOString()
    const { data, error } = await getSupabaseAdmin()
      .from('leads')
      .update({ statement_sent_at: sentAt })
      .eq('id', params.id)
      .select('id')
      .maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: '상담 신청을 찾을 수 없습니다.' }, { status: 404 })
    return NextResponse.json({ ok: true, sentAt })
  } catch (error) {
    return routeError('Admin Lead Statement Sent', error, '전달 기록을 남기지 못했습니다.')
  }
}
