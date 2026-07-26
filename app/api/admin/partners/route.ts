import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import {
  requireAdmin,
  routeError,
  unauthorizedResponse,
} from '@/lib/admin/route'

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return unauthorizedResponse()

  try {
    const supabaseAdmin = getSupabaseAdmin()
    const [partnersResult, inquiriesResult] = await Promise.all([
      supabaseAdmin
        .from('partners')
        .select(
          'id, login_id, nickname, unique_code, level, phone, bank_name, account_number, account_holder, created_at'
        )
        .order('created_at', { ascending: false }),
      supabaseAdmin.from('inquiries').select('marketer_code'),
    ])

    if (partnersResult.error) throw partnersResult.error
    if (inquiriesResult.error) throw inquiriesResult.error

    const inquiryCounts = new Map<string, number>()
    for (const inquiry of inquiriesResult.data ?? []) {
      if (!inquiry.marketer_code) continue
      inquiryCounts.set(
        inquiry.marketer_code,
        (inquiryCounts.get(inquiry.marketer_code) ?? 0) + 1
      )
    }

    return NextResponse.json({
      partners: (partnersResult.data ?? []).map((partner) => ({
        id: partner.id,
        loginId: partner.login_id,
        nickname: partner.nickname,
        uniqueCode: partner.unique_code,
        level: partner.level,
        phone: partner.phone,
        bankName: partner.bank_name,
        accountNumber: partner.account_number,
        accountHolder: partner.account_holder,
        inquiryCount: inquiryCounts.get(partner.unique_code) ?? 0,
        createdAt: partner.created_at,
      })),
    })
  } catch (error) {
    return routeError('Admin Partners', error, '파트너 목록을 불러오지 못했습니다.')
  }
}
