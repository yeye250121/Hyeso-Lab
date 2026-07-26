import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import {
  requireAdmin,
  routeError,
  unauthorizedResponse,
} from '@/lib/admin/route'

export const runtime = 'nodejs'

const PRIVATE_BUCKET = 'benefit-lab-private'
const MAX_FILE_SIZE = 10 * 1024 * 1024
const MIME_EXTENSIONS: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
}
const metadataSchema = z.object({
  partnerCode: z.string().trim().min(1).max(100),
  settlementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

function mapSettlement(settlement: any) {
  return {
    id: settlement.id,
    partnerCode: settlement.partner_code,
    partnerNickname: settlement.partner_nickname,
    settlementDate: settlement.settlement_date,
    fileName: settlement.file_name,
    filePath: settlement.file_path,
    createdAt: settlement.created_at,
  }
}

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return unauthorizedResponse()

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('settlements')
      .select(
        'id, partner_code, partner_nickname, settlement_date, file_name, file_path, created_at'
      )
      .order('settlement_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) throw error

    return NextResponse.json({
      settlements: (data ?? []).map(mapSettlement),
    })
  } catch (error) {
    return routeError('Admin Settlements', error, '정산서 목록을 불러오지 못했습니다.')
  }
}

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request)
  if (!admin) return unauthorizedResponse()

  let uploadedPath: string | null = null
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const parsed = metadataSchema.safeParse({
      partnerCode: formData.get('partnerCode'),
      settlementDate: formData.get('settlementDate'),
    })

    if (!parsed.success || !(file instanceof File)) {
      return NextResponse.json({ error: '모든 항목을 입력해주세요.' }, { status: 400 })
    }

    const extension = MIME_EXTENSIONS[file.type]
    if (!extension) {
      return NextResponse.json(
        { error: 'PDF, JPG, PNG 파일만 업로드할 수 있습니다.' },
        { status: 400 }
      )
    }
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '파일은 10MB 이하만 업로드할 수 있습니다.' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('unique_code, nickname')
      .eq('unique_code', parsed.data.partnerCode)
      .maybeSingle()
    if (partnerError) throw partnerError
    if (!partner) {
      return NextResponse.json({ error: '파트너를 찾을 수 없습니다.' }, { status: 404 })
    }

    uploadedPath = `settlements/${partner.unique_code}/${parsed.data.settlementDate}/${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await supabaseAdmin.storage
      .from(PRIVATE_BUCKET)
      .upload(uploadedPath, Buffer.from(await file.arrayBuffer()), {
        contentType: file.type,
        upsert: false,
      })
    if (uploadError) throw uploadError

    const { data: settlement, error: insertError } = await supabaseAdmin
      .from('settlements')
      .insert({
        partner_code: partner.unique_code,
        partner_nickname: partner.nickname,
        settlement_date: parsed.data.settlementDate,
        file_name: file.name.slice(0, 255),
        file_path: uploadedPath,
        content_type: file.type,
        file_size: file.size,
        created_by: admin.id,
      })
      .select(
        'id, partner_code, partner_nickname, settlement_date, file_name, file_path, created_at'
      )
      .single()
    if (insertError) throw insertError

    return NextResponse.json(
      { settlement: mapSettlement(settlement) },
      { status: 201 }
    )
  } catch (error) {
    if (uploadedPath) {
      try {
        await getSupabaseAdmin().storage
          .from(PRIVATE_BUCKET)
          .remove([uploadedPath])
      } catch (cleanupError) {
        console.error('[Settlement Upload Cleanup]', cleanupError)
      }
    }
    return routeError('Admin Settlement Upload', error, '정산서를 업로드하지 못했습니다.')
  }
}
