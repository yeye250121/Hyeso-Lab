import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'
import { sendApplicationLinkAlimtalk } from '@/lib/alimtalk-service'
import { generateShortToken } from '@/lib/shortToken'

// 상담 신청 접수 안내 알림톡 수동 (재)발송. 토큰이 없는 옛 상담 신청이면 만들어서 보낸다.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = requireAdmin(request)
  if (!admin) return unauthorizedResponse()

  try {
    const db = getSupabaseAdmin()
    const { data: lead, error } = await db.from('leads').select('id, service, phone_number, short_token').eq('id', params.id).maybeSingle()
    if (error) throw error
    if (!lead) return NextResponse.json({ error: '상담 신청을 찾을 수 없습니다.' }, { status: 404 })
    if (lead.service === 'card') return NextResponse.json({ error: '카드 상담은 신청서 링크가 없습니다.' }, { status: 400 })

    let token = lead.short_token as string | null
    if (!token) {
      token = generateShortToken()
      const { error: e } = await db.from('leads').update({ short_token: token }).eq('id', lead.id)
      if (e) throw e
    }

    console.info(`[Admin] 알림톡 재발송: lead=${lead.id} admin=${admin.loginId}`)
    const result = await sendApplicationLinkAlimtalk({ id: lead.id, phone_number: lead.phone_number, short_token: token })
    return NextResponse.json({
      success: result.success,
      sentAt: result.success ? new Date().toISOString() : undefined,
      error: result.error,
      skipped: result.skipped,
    })
  } catch (error) {
    return routeError('Admin Lead Alimtalk', error, '알림톡을 보내지 못했습니다.')
  }
}
