import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'
import { buildApplicationStatement } from '@/lib/admin/statement'

// 신청서 → 명세서 텍스트. 계좌번호·생년월일이 그대로 들어가므로 만든 사실을 로그에 남긴다.
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = requireAdmin(request)
  if (!admin) return unauthorizedResponse()

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('electronics_applications')
      .select('*')
      .eq('id', params.id)
      .maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: '신청서를 찾을 수 없습니다.' }, { status: 404 })

    console.info(`[Admin] 명세서 생성: application=${data.id} admin=${admin.loginId}`)
    return NextResponse.json({ text: buildApplicationStatement(data), sentAt: data.statement_sent_at })
  } catch (error) {
    return routeError('Admin Application Statement', error, '명세서를 만들지 못했습니다.')
  }
}

// 상위 업체에 전달했음을 기록한다. 아직 신규 상태면 진행중으로 올린다.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!requireAdmin(request)) return unauthorizedResponse()

  try {
    const db = getSupabaseAdmin()
    const sentAt = new Date().toISOString()
    const { data, error } = await db
      .from('electronics_applications')
      .update({ statement_sent_at: sentAt })
      .eq('id', params.id)
      .select('id, status')
      .maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: '신청서를 찾을 수 없습니다.' }, { status: 404 })

    let status = data.status
    if (status === 'new') {
      status = 'in_progress'
      await db.from('electronics_applications').update({ status }).eq('id', params.id)
    }
    return NextResponse.json({ ok: true, sentAt, status })
  } catch (error) {
    return routeError('Admin Application Statement Sent', error, '전달 기록을 남기지 못했습니다.')
  }
}
