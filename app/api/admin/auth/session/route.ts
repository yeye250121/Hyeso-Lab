import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin/auth'

export async function GET(request: NextRequest) {
  const admin = getAdminContext(request)
  if (!admin) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  return NextResponse.json({ admin })
}
