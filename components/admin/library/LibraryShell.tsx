'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight, FileText, FolderTree, Plus, Search, X } from 'lucide-react'
import api from '@/lib/admin/api'
import type { LibraryNode } from '@/lib/admin/library'
import DocView from './DocView'
import { useConsole } from '@/lib/admin/useConsole'

// 교육자료 라이브러리. 왼쪽 트리(문서 안에 하위 문서) + 오른쪽 문서.
// 트리는 한 번 받아 클라이언트에서 접고 펴고, 문서 본문은 열 때마다 받는다.

type SearchHit = { id: string; title: string; emoji: string | null; snippet: string }

export default function LibraryShell({ activeId }: { activeId: string | null }) {
  const { path: cp } = useConsole()
  const router = useRouter()
  const [docs, setDocs] = useState<LibraryNode[]>([])
  const [canEdit, setCanEdit] = useState(false)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [treeOpenMobile, setTreeOpenMobile] = useState(false)
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<SearchHit[] | null>(null)

  const loadTree = useCallback(async () => {
    const res = await api.get('/admin/library')
    setDocs(res.data.docs)
    setCanEdit(res.data.canEdit)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadTree()
  }, [loadTree])

  // 활성 문서의 조상은 펼쳐 둔다
  useEffect(() => {
    if (!activeId || docs.length === 0) return
    const parent = new Map(docs.map((d) => [d.id, d.parentId]))
    const next: Record<string, boolean> = {}
    let cur = parent.get(activeId) ?? null
    while (cur) {
      next[cur] = true
      cur = parent.get(cur) ?? null
    }
    setOpen((o) => ({ ...o, ...next }))
  }, [activeId, docs])

  // 검색(디바운스)
  useEffect(() => {
    if (!q.trim()) {
      setHits(null)
      return
    }
    const t = setTimeout(async () => {
      const res = await api.get(`/admin/library/search?q=${encodeURIComponent(q.trim())}`)
      setHits(res.data.results)
    }, 250)
    return () => clearTimeout(t)
  }, [q])

  const children = useMemo(() => {
    const m = new Map<string | null, LibraryNode[]>()
    for (const d of docs) {
      const arr = m.get(d.parentId) ?? []
      arr.push(d)
      m.set(d.parentId, arr)
    }
    return m
  }, [docs])

  const createDoc = async (parentId: string | null) => {
    const res = await api.post('/admin/library', { parentId })
    await loadTree()
    if (parentId) setOpen((o) => ({ ...o, [parentId]: true }))
    router.push(cp(`/library/${res.data.doc.id}?edit=1`))
  }

  const Tree = ({ parentId, depth }: { parentId: string | null; depth: number }) => {
    const items = children.get(parentId) ?? []
    if (items.length === 0) return null
    return (
      <ul className={depth === 0 ? '' : 'ml-3 border-l border-border pl-1'}>
        {items.map((d) => {
          const kids = children.get(d.id) ?? []
          const isOpen = !!open[d.id]
          const active = d.id === activeId
          return (
            <li key={d.id}>
              <div className={`group flex items-center gap-1 rounded-button pr-1 ${active ? 'bg-action-primary/10' : 'hover:bg-bg-primary'}`}>
                <button
                  type="button"
                  onClick={() => setOpen((o) => ({ ...o, [d.id]: !isOpen }))}
                  className={`w-5 h-7 flex items-center justify-center text-text-tertiary ${kids.length ? '' : 'invisible'}`}
                  aria-label={isOpen ? '접기' : '펼치기'}
                >
                  {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                <Link
                  href={cp(`/library/${d.id}`)}
                  onClick={() => setTreeOpenMobile(false)}
                  className={`flex-1 min-w-0 flex items-center gap-1.5 py-1.5 text-small truncate ${active ? 'font-semibold text-text-primary' : 'text-text-secondary'} ${!d.isPublished ? 'opacity-60' : ''}`}
                >
                  <span className="w-4 text-center shrink-0">{d.emoji || <FileText className="w-3.5 h-3.5 inline text-text-tertiary" />}</span>
                  <span className="truncate">{d.title}</span>
                  {!d.isPublished && <span className="text-[10px] text-text-tertiary shrink-0">초안</span>}
                </Link>
                {canEdit && (
                  <button type="button" onClick={() => createDoc(d.id)} title="하위 문서 추가" className="w-6 h-6 hidden group-hover:flex items-center justify-center rounded text-text-tertiary hover:text-text-primary hover:bg-bg-card">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {isOpen && <Tree parentId={d.id} depth={depth + 1} />}
            </li>
          )
        })}
      </ul>
    )
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="문서 검색"
          className="w-full pl-9 pr-8 py-2 rounded-button bg-bg-primary border border-border text-small text-text-primary"
        />
        {q && (
          <button type="button" onClick={() => setQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary" aria-label="검색 지우기">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {hits ? (
        <ul className="flex-1 overflow-y-auto space-y-1" data-testid="library-search-results">
          {hits.length === 0 && <li className="px-2 py-6 text-center text-small text-text-tertiary">검색 결과가 없어요</li>}
          {hits.map((h) => (
            <li key={h.id}>
              <Link href={cp(`/library/${h.id}`)} onClick={() => { setQ(''); setTreeOpenMobile(false) }} className="block px-2 py-2 rounded-button hover:bg-bg-primary">
                <p className="text-small font-medium text-text-primary truncate">{h.emoji ? `${h.emoji} ` : ''}{h.title}</p>
                {h.snippet && <p className="text-xs text-text-secondary line-clamp-2 mt-0.5">{h.snippet}</p>}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex-1 overflow-y-auto" data-testid="library-tree">
          {loading ? (
            <p className="px-2 py-6 text-center text-small text-text-tertiary">불러오는 중…</p>
          ) : docs.length === 0 ? (
            <p className="px-2 py-6 text-center text-small text-text-tertiary">아직 문서가 없어요</p>
          ) : (
            <Tree parentId={null} depth={0} />
          )}
        </div>
      )}

      {canEdit && (
        <button type="button" onClick={() => createDoc(null)} className="mt-3 flex items-center justify-center gap-1.5 py-2 rounded-button border border-dashed border-border text-small text-text-secondary hover:text-text-primary hover:bg-bg-primary">
          <Plus className="w-4 h-4" /> 새 문서
        </button>
      )}
    </div>
  )

  return (
    <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6 lg:items-start">
      {/* 모바일: 트리 토글 */}
      <div className="lg:hidden mb-3">
        <button type="button" onClick={() => setTreeOpenMobile((v) => !v)} className="flex items-center gap-2 px-3 py-2 rounded-button bg-bg-card border border-border text-small text-text-primary">
          <FolderTree className="w-4 h-4" /> {treeOpenMobile ? '목록 닫기' : '문서 목록'}
        </button>
        {treeOpenMobile && <div className="mt-2 rounded-card bg-bg-card p-3 max-h-[60vh] flex flex-col">{sidebar}</div>}
      </div>

      <aside className="hidden lg:flex flex-col rounded-card bg-bg-card p-3 sticky top-6 h-[calc(100vh-3rem)]">{sidebar}</aside>

      <section className="min-w-0">
        {activeId ? (
          <DocView id={activeId} onChanged={loadTree} />
        ) : (
          <div className="rounded-card bg-bg-card px-6 py-16 text-center">
            <p className="text-title text-text-primary">교육자료 라이브러리</p>
            <p className="mt-2 text-small text-text-secondary">왼쪽에서 문서를 고르거나 검색하세요.{canEdit ? ' 새 문서는 아래 버튼으로 만듭니다.' : ''}</p>
          </div>
        )}
      </section>
    </div>
  )
}
