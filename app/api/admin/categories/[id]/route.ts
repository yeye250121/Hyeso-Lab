import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import {
  requireAdmin,
  routeError,
  slugify,
  unauthorizedResponse,
} from '@/lib/admin/route'

const updateSchema = z.object({
  name: z.string().trim().min(1).max(80),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!requireAdmin(request)) return unauthorizedResponse()

  const parsed = updateSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: '카테고리명을 입력해주세요.' }, { status: 400 })
  }
  const slug = slugify(parsed.data.name)
  if (!slug) {
    return NextResponse.json({ error: '올바른 카테고리명을 입력해주세요.' }, { status: 400 })
  }

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('guide_categories')
      .update({ name: parsed.data.name, slug })
      .eq('id', params.id)
      .select('id, name, slug, display_order')
      .maybeSingle()
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: '이미 존재하는 카테고리입니다.' },
          { status: 409 }
        )
      }
      throw error
    }
    if (!data) {
      return NextResponse.json({ error: '카테고리를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ category: data })
  } catch (error) {
    return routeError('Admin Category Update', error, '카테고리를 수정하지 못했습니다.')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!requireAdmin(request)) return unauthorizedResponse()

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('guide_categories')
      .delete()
      .eq('id', params.id)
      .select('id')
      .maybeSingle()
    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: '카테고리를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ message: '카테고리가 삭제되었습니다.' })
  } catch (error) {
    return routeError('Admin Category Delete', error, '카테고리를 삭제하지 못했습니다.')
  }
}
