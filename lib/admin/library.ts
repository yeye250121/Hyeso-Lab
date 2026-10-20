import { getSupabaseAdmin } from '@/lib/supabase-admin'

// 교육자료 라이브러리 공용 조각. 트리 조회, 본문 텍스트 추출, 순서 재배치.

export type LibraryNode = {
  id: string
  parentId: string | null
  title: string
  emoji: string | null
  sortOrder: number
  isPublished: boolean
  updatedAt: string
}

export const TREE_COLUMNS = 'id, parent_id, title, emoji, sort_order, is_published, updated_at'

export function toNode(r: Record<string, unknown>): LibraryNode {
  return {
    id: r.id as string,
    parentId: (r.parent_id as string | null) ?? null,
    title: r.title as string,
    emoji: (r.emoji as string | null) ?? null,
    sortOrder: r.sort_order as number,
    isPublished: r.is_published as boolean,
    updatedAt: r.updated_at as string,
  }
}

/** 편집기 HTML 에서 검색용 텍스트만 남긴다 */
export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|tr|blockquote|summary|details)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim()
    .slice(0, 200_000)
}

/** 같은 부모 아래 마지막 순서 */
export async function nextSortOrder(parentId: string | null): Promise<number> {
  let q = getSupabaseAdmin().from('library_docs').select('sort_order').order('sort_order', { ascending: false }).limit(1)
  q = parentId ? q.eq('parent_id', parentId) : q.is('parent_id', null)
  const { data } = await q
  return ((data?.[0]?.sort_order as number | undefined) ?? -1) + 1
}

/** id 가 ancestor 의 자손(또는 자기 자신)이면 true. 자기 아래로 옮기는 걸 막는다 */
export async function isDescendant(id: string, ancestor: string): Promise<boolean> {
  if (id === ancestor) return true
  const { data } = await getSupabaseAdmin().from('library_docs').select('id, parent_id')
  const parent = new Map((data ?? []).map((r) => [r.id as string, r.parent_id as string | null]))
  let cur: string | null = ancestor
  const seen = new Set<string>()
  while (cur && !seen.has(cur)) {
    if (cur === id) return true
    seen.add(cur)
    cur = parent.get(cur) ?? null
  }
  return false
}
