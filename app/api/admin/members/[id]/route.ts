import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'
import { sendPartnerApprovedAlimtalk } from '@/lib/alimtalk-service'

const schema = z
  .object({
    role: z.enum(['owner', 'admin', 'marketer']).optional(),
    phone: z.string().trim().max(20).nullable().optional(),
    notifyLeads: z.boolean().optional(),
    /** 승인(active) / 거부(rejected) / 비활성(disabled) */
    status: z.enum(['active', 'rejected', 'disabled']).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, '변경할 값이 없습니다.')

// 구성원 역할·전화번호·알림 설정 변경. 오너만. 자기 역할은 낮출 수 없다(오너가 0명이 되는 걸 막는다).
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = requireAdmin(request, ['owner'])
  if (!admin) return unauthorizedResponse()
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: '올바르지 않은 값입니다.' }, { status: 400 })
  if (params.id === admin.id && parsed.data.role && parsed.data.role !== 'owner') {
    return NextResponse.json({ error: '본인의 역할은 낮출 수 없습니다.' }, { status: 400 })
  }
  if (params.id === admin.id && parsed.data.status && parsed.data.status !== 'active') {
    return NextResponse.json({ error: '본인 계정은 막을 수 없습니다.' }, { status: 400 })
  }
  try {
    const patch: Record<string, unknown> = {}
    if (parsed.data.role !== undefined) patch.role = parsed.data.role
    if (parsed.data.phone !== undefined) patch.phone = parsed.data.phone ? parsed.data.phone.replace(/\D/g, '') : null
    if (parsed.data.notifyLeads !== undefined) patch.notify_leads = parsed.data.notifyLeads
    if (parsed.data.status !== undefined) {
      patch.status = parsed.data.status
      patch.reviewed_at = new Date().toISOString()
      patch.reviewed_by = admin.id
    }
    const db = getSupabaseAdmin()
    const { data: before } = await db.from('admin_users').select('status, phone, nickname, login_id, role').eq('id', params.id).maybeSingle()
    const { data, error } = await db.from('admin_users').update(patch).eq('id', params.id).select('id').maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: '구성원을 찾을 수 없습니다.' }, { status: 404 })
    console.info(`[Admin] 구성원 변경: member=${params.id} by=${admin.loginId} ${JSON.stringify(patch)}`)

    // 승인 대기 → 사용 중으로 바뀐 파트너스에게 승인 안내
    let notified: boolean | undefined
    if (parsed.data.status === 'active' && before?.status === 'pending' && before.phone) {
      const r = await sendPartnerApprovedAlimtalk(before.phone as string, before.nickname as string, before.login_id as string)
      notified = r.success
    }
    return NextResponse.json({ ok: true, notified })
  } catch (error) {
    return routeError('Admin Member Update', error, '구성원을 수정하지 못했습니다.')
  }
}
