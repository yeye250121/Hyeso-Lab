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
    const [
      partnersResult,
      inquiriesResult,
      newResult,
      contractedResult,
      recentResult,
    ] = await Promise.all([
      supabaseAdmin.from('partners').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('inquiries').select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new'),
      supabaseAdmin
        .from('inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'contracted'),
      supabaseAdmin
        .from('inquiries')
        .select('id, name, phone_number, marketer_code, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    const error =
      partnersResult.error ||
      inquiriesResult.error ||
      newResult.error ||
      contractedResult.error ||
      recentResult.error
    if (error) throw error

    return NextResponse.json({
      totalPartners: partnersResult.count ?? 0,
      totalInquiries: inquiriesResult.count ?? 0,
      newInquiries: newResult.count ?? 0,
      contractedInquiries: contractedResult.count ?? 0,
      recentInquiries: (recentResult.data ?? []).map((inquiry) => ({
        id: inquiry.id,
        name: inquiry.name || '이름 미입력',
        phone: inquiry.phone_number,
        marketerCode: inquiry.marketer_code || '-',
        status: inquiry.status,
        createdAt: inquiry.created_at,
      })),
    })
  } catch (error) {
    return routeError('Admin Dashboard', error, '대시보드를 불러오지 못했습니다.')
  }
}
