import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import {
  requireAdmin,
  routeError,
  slugify,
  unauthorizedResponse,
} from '@/lib/admin/route'

const categorySchema = z.object({
  name: z.string().trim().min(1).max(80),
})

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return unauthorizedResponse()

  try {
    const supabaseAdmin = getSupabaseAdmin()
    const [categoriesResult, guidesResult] = await Promise.all([
      supabaseAdmin
        .from('guide_categories')
        .select('id, name, slug, display_order')
        .order('display_order', { ascending: true })
        .order('name', { ascending: true }),
      supabaseAdmin.from('guides').select('category_id'),
    ])
    if (categoriesResult.error) throw categoriesResult.error
    if (guidesResult.error) throw guidesResult.error

    const counts = new Map<string, number>()
    for (const guide of guidesResult.data ?? []) {
      if (!guide.category_id) continue
      counts.set(guide.category_id, (counts.get(guide.category_id) ?? 0) + 1)
    }

    return NextResponse.json({
      categories: (categoriesResult.data ?? []).map((category) => ({
        ...category,
        guideCount: counts.get(category.id) ?? 0,
      })),
    })
  } catch (error) {
    return routeError('Admin Categories', error, '카테고리를 불러오지 못했습니다.')
  }
}

export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) return unauthorizedResponse()

  const parsed = categorySchema.safeParse(await request.json())
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
      .insert({ name: parsed.data.name, slug })
      .select('id, name, slug, display_order')
      .single()
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: '이미 존재하는 카테고리입니다.' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({ category: data }, { status: 201 })
  } catch (error) {
    return routeError('Admin Category Create', error, '카테고리를 만들지 못했습니다.')
  }
}
