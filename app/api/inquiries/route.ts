import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserContext } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0


/**
 * 하위 파트너 트리 조회 (재귀)
 */
async function getSubordinateCodes(uniqueCode: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin.rpc('get_subordinate_codes', {
    root_code: uniqueCode,
  })

  if (error) {
    // RPC 함수가 없으면 직접 재귀 쿼리 실행
    console.log('[Inquiries] RPC 함수 없음, 직접 조회')
    return await getSubordinateCodesManual(uniqueCode)
  }

  return data || [uniqueCode]
}

/**
 * 하위 파트너 트리 조회 (수동 재귀)
 */
async function getSubordinateCodesManual(uniqueCode: string): Promise<string[]> {
  const codes = [uniqueCode]
  const queue = [uniqueCode]

  while (queue.length > 0) {
    const currentCode = queue.shift()!

    const { data: children } = await supabaseAdmin
      .from('users')
      .select('unique_code')
      .eq('referrer_code', currentCode)

    if (children && children.length > 0) {
      for (const child of children) {
        codes.push(child.unique_code)
        queue.push(child.unique_code)
      }
    }
  }

  return codes
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserContext(request)

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') // 'new', 'in_progress', 'contracted', 'cancelled'
    const onlyMine = searchParams.get('onlyMine') === 'true'
    const search = searchParams.get('search') || ''
    const partnerCode = searchParams.get('partnerCode') // 특정 파트너 코드 필터

    const offset = (page - 1) * limit

    // 본인 + 하위 파트너 코드 조회
    let codes: string[]
    if (partnerCode) {
      // 특정 파트너 코드 필터 (하위 파트너 문의 보기)
      codes = [partnerCode]
    } else if (onlyMine) {
      codes = [user.uniqueCode]
    } else {
      codes = await getSubordinateCodes(user.uniqueCode)
    }

    // 쿼리 빌더 - 예약 관련 필드 포함
    let query = supabaseAdmin
      .from('inquiries')
      .select('id, phone_number, install_location, install_count, marketer_code, status, submitted_at, created_at, inquiry_type, reservation_date, reservation_time_slot, outdoor_count, indoor_count, address, address_detail, zonecode, documents, documents_submitted', { count: 'exact' })
      .in('marketer_code', codes)
      .order('submitted_at', { ascending: false })

    // 상태 필터
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // 검색 필터 (전화번호 또는 설치위치)
    if (search) {
      query = query.or(`phone_number.ilike.%${search}%,install_location.ilike.%${search}%`)
    }

    // 페이지네이션
    query = query.range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) {
      console.error('[Inquiries] 조회 오류:', error)
      return NextResponse.json({ error: '문의 목록 조회 실패' }, { status: 500 })
    }

    // 각 문의에 수정 가능 여부 추가
    const inquiriesWithPermission = data?.map((inquiry) => ({
      ...inquiry,
      canEdit: inquiry.marketer_code === user.uniqueCode,
    }))

    return NextResponse.json({
      data: inquiriesWithPermission,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
      },
      userCode: user.uniqueCode,
    })
  } catch (error) {
    console.error('[Inquiries] Error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
