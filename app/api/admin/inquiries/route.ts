import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import {
  requireAdmin,
  routeError,
  unauthorizedResponse,
} from '@/lib/admin/route'

const STATUSES = new Set(['new', 'in_progress', 'contracted', 'cancelled'])

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return unauthorizedResponse()

  const status = request.nextUrl.searchParams.get('status')
  if (status && !STATUSES.has(status)) {
    return NextResponse.json({ error: '올바르지 않은 상태값입니다.' }, { status: 400 })
  }

  try {
    const supabaseAdmin = getSupabaseAdmin()
    let query = supabaseAdmin
      .from('inquiries')
      .select(
        'id, phone_number, install_location, install_count, marketer_code, status, submitted_at, inquiry_type, reservation_date, reservation_time_slot, outdoor_count, indoor_count, address, address_detail, documents, documents_submitted'
      )
      .order('submitted_at', { ascending: false })

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({
      inquiries: (data ?? []).map((inquiry) => ({
        id: inquiry.id,
        phone: inquiry.phone_number,
        installLocation: inquiry.install_location,
        installCount: inquiry.install_count,
        marketerCode: inquiry.marketer_code || '',
        status: inquiry.status,
        submittedAt: inquiry.submitted_at,
        inquiryType: inquiry.inquiry_type,
        reservationDate: inquiry.reservation_date,
        reservationTimeSlot: inquiry.reservation_time_slot,
        outdoorCount: inquiry.outdoor_count,
        indoorCount: inquiry.indoor_count,
        address: inquiry.address,
        addressDetail: inquiry.address_detail,
        documents: inquiry.documents,
        documentsSubmitted: inquiry.documents_submitted,
      })),
    })
  } catch (error) {
    return routeError('Admin Inquiries', error, '문의 목록을 불러오지 못했습니다.')
  }
}
