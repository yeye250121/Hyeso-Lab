import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'
import { ALL_ROLES } from '@/lib/admin/auth'

// 제목+본문 검색. 한글은 형태소 분석 없이 부분 일치(ilike)로 충분하다(문서 수가 적다).
export async function GET(request: NextRequest) {
  const admin = requireAdmin(request, ALL_ROLES)
  if (!admin) return unauthorizedResponse()
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 1) return NextResponse.json({ results: [] })
  try {
    const safe = q.replace(/[%_,()]/g, ' ').trim()
    let query = getSupabaseAdmin()
      .from('library_docs')
      .select('id, title, emoji, content_text, updated_at')
      .or(`title.ilike.%${safe}%,content_text.ilike.%${safe}%`)
      .order('updated_at', { ascending: false })
      .limit(20)
    if (admin.role === 'marketer') query = query.eq('is_published', true)
    const { data, error } = await query
    if (error) throw error
    const results = (data ?? []).map((d) => {
      const text = (d.content_text as string) ?? ''
      const i = text.toLowerCase().indexOf(safe.toLowerCase())
      const snippet = i >= 0 ? text.slice(Math.max(0, i - 40), i + 80) : text.slice(0, 120)
      return { id: d.id, title: d.title, emoji: d.emoji, snippet: snippet.replace(/\s+/g, ' ').trim(), updatedAt: d.updated_at }
    })
    return NextResponse.json({ results })
  } catch (error) {
    return routeError('Admin Library Search', error, '검색하지 못했습니다.')
  }
}
