import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'
import { ALL_ROLES } from '@/lib/admin/auth'
import { htmlToText, isDescendant } from '@/lib/admin/library'

const DOC_COLUMNS = 'id, parent_id, title, emoji, content, sort_order, is_published, created_at, updated_at, updated_by, editor:admin_users!library_docs_updated_by_fkey(nickname)'

function mapDoc(d: Record<string, unknown>) {
  const editor = d.editor as { nickname?: string } | { nickname?: string }[] | null
  const nickname = Array.isArray(editor) ? editor[0]?.nickname : editor?.nickname
  return {
    id: d.id,
    parentId: d.parent_id ?? null,
    title: d.title,
    emoji: d.emoji ?? null,
    content: d.content,
    sortOrder: d.sort_order,
    isPublished: d.is_published,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    updatedBy: nickname ?? null,
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = requireAdmin(request, ALL_ROLES)
  if (!admin) return unauthorizedResponse()
  try {
    const { data, error } = await getSupabaseAdmin().from('library_docs').select(DOC_COLUMNS).eq('id', params.id).maybeSingle()
    if (error) throw error
    if (!data || (admin.role === 'marketer' && !data.is_published)) return NextResponse.json({ error: '문서를 찾을 수 없습니다.' }, { status: 404 })
    return NextResponse.json({ doc: mapDoc(data as Record<string, unknown>), canEdit: admin.role !== 'marketer' })
  } catch (error) {
    return routeError('Admin Library Doc', error, '문서를 불러오지 못했습니다.')
  }
}

const updateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  emoji: z.string().trim().max(8).nullable().optional(),
  content: z.string().max(1_000_000).optional(),
  isPublished: z.boolean().optional(),
  parentId: z.string().uuid().nullable().optional(),
  /** 같은 부모 안에서의 위치(0부터). parentId 와 함께 쓰면 이동 */
  position: z.number().int().min(0).optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = requireAdmin(request)
  if (!admin) return unauthorizedResponse()
  const parsed = updateSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: '올바르지 않은 값입니다.' }, { status: 400 })
  const v = parsed.data

  try {
    const db = getSupabaseAdmin()
    const patch: Record<string, unknown> = { updated_by: admin.id }
    if (v.title !== undefined) patch.title = v.title
    if (v.emoji !== undefined) patch.emoji = v.emoji || null
    if (v.content !== undefined) {
      patch.content = v.content
      patch.content_text = htmlToText(v.content)
    }
    if (v.isPublished !== undefined) patch.is_published = v.isPublished

    // 이동/정렬: 대상 부모의 형제 목록을 다시 번호 매긴다
    if (v.parentId !== undefined || v.position !== undefined) {
      const { data: cur, error: curErr } = await db.from('library_docs').select('parent_id').eq('id', params.id).maybeSingle()
      if (curErr) throw curErr
      if (!cur) return NextResponse.json({ error: '문서를 찾을 수 없습니다.' }, { status: 404 })
      const targetParent = v.parentId !== undefined ? v.parentId : (cur.parent_id as string | null)
      if (targetParent && (await isDescendant(targetParent, params.id))) {
        return NextResponse.json({ error: '자기 자신 아래로는 옮길 수 없습니다.' }, { status: 400 })
      }
      let q = db.from('library_docs').select('id').neq('id', params.id).order('sort_order').order('created_at')
      q = targetParent ? q.eq('parent_id', targetParent) : q.is('parent_id', null)
      const { data: siblings, error: sibErr } = await q
      if (sibErr) throw sibErr
      const ids = (siblings ?? []).map((s) => s.id as string)
      const pos = v.position !== undefined ? Math.min(v.position, ids.length) : ids.length
      ids.splice(pos, 0, params.id)
      for (let i = 0; i < ids.length; i++) {
        const { error: e } = await db.from('library_docs').update(ids[i] === params.id ? { ...patch, parent_id: targetParent, sort_order: i } : { sort_order: i }).eq('id', ids[i])
        if (e) throw e
      }
    } else {
      const { data, error } = await db.from('library_docs').update(patch).eq('id', params.id).select('id').maybeSingle()
      if (error) throw error
      if (!data) return NextResponse.json({ error: '문서를 찾을 수 없습니다.' }, { status: 404 })
    }

    const { data: doc, error: docErr } = await db.from('library_docs').select(DOC_COLUMNS).eq('id', params.id).single()
    if (docErr) throw docErr
    return NextResponse.json({ doc: mapDoc(doc as Record<string, unknown>) })
  } catch (error) {
    return routeError('Admin Library Update', error, '문서를 저장하지 못했습니다.')
  }
}

// 삭제하면 하위 문서도 함께 지워진다(cascade). 운영진만.
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = requireAdmin(request)
  if (!admin) return unauthorizedResponse()
  try {
    const { data, error } = await getSupabaseAdmin().from('library_docs').delete().eq('id', params.id).select('id').maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: '문서를 찾을 수 없습니다.' }, { status: 404 })
    console.info(`[Admin] 라이브러리 문서 삭제: ${params.id} admin=${admin.loginId}`)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return routeError('Admin Library Delete', error, '문서를 삭제하지 못했습니다.')
  }
}

