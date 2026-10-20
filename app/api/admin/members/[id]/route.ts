import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'

const schema = z
  .object({
    role: z.enum(['owner', 'admin', 'marketer']).optional(),
    phone: z.string().trim().max(20).nullable().optional(),
    notifyLeads: z.boolean().optional(),
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
  try {
    const patch: Record<string, unknown> = {}
    if (parsed.data.role !== undefined) patch.role = parsed.data.role
    if (parsed.data.phone !== undefined) patch.phone = parsed.data.phone ? parsed.data.phone.replace(/\D/g, '') : null
    if (parsed.data.notifyLeads !== undefined) patch.notify_leads = parsed.data.notifyLeads
    const { data, error } = await getSupabaseAdmin().from('admin_users').update(patch).eq('id', params.id).select('id').maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: '구성원을 찾을 수 없습니다.' }, { status: 404 })
    console.info(`[Admin] 구성원 변경: member=${params.id} by=${admin.loginId} ${JSON.stringify(patch)}`)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return routeError('Admin Member Update', error, '구성원을 수정하지 못했습니다.')
  }
}
