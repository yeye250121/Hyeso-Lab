import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import {
  requireAdmin,
  routeError,
  unauthorizedResponse,
} from '@/lib/admin/route'

const updateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(500_000),
  isPublished: z.boolean(),
  categoryId: z.string().uuid().nullable().optional(),
})

function normalizeCategory(category: any) {
  if (!category) return null
  return Array.isArray(category) ? category[0] ?? null : category
}

function mapGuide(guide: any) {
  return {
    id: guide.id,
    title: guide.title,
    slug: guide.slug,
    content: guide.content,
    isPublished: guide.is_published,
    categoryId: guide.category_id,
    category: normalizeCategory(guide.category),
    createdAt: guide.created_at,
    updatedAt: guide.updated_at,
  }
}

const selectFields =
  'id, title, slug, content, is_published, category_id, created_at, updated_at, category:guide_categories(id, name, slug, display_order)'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!requireAdmin(request)) return unauthorizedResponse()

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('guides')
      .select(selectFields)
      .eq('id', params.id)
      .maybeSingle()
    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: '가이드를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ guide: mapGuide(data) })
  } catch (error) {
    return routeError('Admin Guide Detail', error, '가이드를 불러오지 못했습니다.')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!requireAdmin(request)) return unauthorizedResponse()

  const parsed = updateSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: '가이드 입력값을 확인해주세요.' }, { status: 400 })
  }

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('guides')
      .update({
        title: parsed.data.title,
        slug: parsed.data.slug,
        content: parsed.data.content,
        is_published: parsed.data.isPublished,
        category_id: parsed.data.categoryId ?? null,
      })
      .eq('id', params.id)
      .select(selectFields)
      .maybeSingle()
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: '이미 사용 중인 슬러그입니다.' },
          { status: 409 }
        )
      }
      throw error
    }
    if (!data) {
      return NextResponse.json({ error: '가이드를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ guide: mapGuide(data) })
  } catch (error) {
    return routeError('Admin Guide Update', error, '가이드를 수정하지 못했습니다.')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!requireAdmin(request)) return unauthorizedResponse()

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('guides')
      .delete()
      .eq('id', params.id)
      .select('id')
      .maybeSingle()
    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: '가이드를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ message: '가이드가 삭제되었습니다.' })
  } catch (error) {
    return routeError('Admin Guide Delete', error, '가이드를 삭제하지 못했습니다.')
  }
}
