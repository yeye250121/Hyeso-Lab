import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import {
  requireAdmin,
  routeError,
  unauthorizedResponse,
} from '@/lib/admin/route'

const guideSchema = z.object({
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

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return unauthorizedResponse()

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('guides')
      .select(
        'id, title, slug, content, is_published, category_id, created_at, updated_at, category:guide_categories(id, name, slug, display_order)'
      )
      .order('updated_at', { ascending: false })
    if (error) throw error

    return NextResponse.json({ guides: (data ?? []).map(mapGuide) })
  } catch (error) {
    return routeError('Admin Guides', error, '가이드를 불러오지 못했습니다.')
  }
}

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request)
  if (!admin) return unauthorizedResponse()

  const parsed = guideSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: '가이드 입력값을 확인해주세요.' }, { status: 400 })
  }

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('guides')
      .insert({
        title: parsed.data.title,
        slug: parsed.data.slug,
        content: parsed.data.content,
        is_published: parsed.data.isPublished,
        category_id: parsed.data.categoryId ?? null,
        created_by: admin.id,
      })
      .select(
        'id, title, slug, content, is_published, category_id, created_at, updated_at, category:guide_categories(id, name, slug, display_order)'
      )
      .single()
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: '이미 사용 중인 슬러그입니다.' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({ guide: mapGuide(data) }, { status: 201 })
  } catch (error) {
    return routeError('Admin Guide Create', error, '가이드를 저장하지 못했습니다.')
  }
}
