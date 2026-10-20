'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Search } from 'lucide-react'
import type { LibraryNode } from '@/lib/admin/library'
import { useConsole } from '@/lib/admin/useConsole'

// 파트너스용 라이브러리 = 토스플레이스 "포스 가이드" 식 갤러리.
// 상단 탭 = 최상위 문서(카테고리)와 개수, 카드 = 그 아래 문서(썸네일·카테고리·제목·날짜).

const PASTELS = ['#e8f3ff', '#fff1f5', '#eefbf3', '#fff7e6', '#f3efff', '#e6f7fb']

function dateLabel(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default function LibraryGallery({ docs }: { docs: LibraryNode[] }) {
  const { path: cp } = useConsole()
  const [tab, setTab] = useState<string>('')
  const [q, setQ] = useState('')

  const { categories, articles } = useMemo(() => {
    const byId = new Map(docs.map((d) => [d.id, d]))
    const roots = docs.filter((d) => !d.parentId)
    const hasChildren = new Set(docs.filter((d) => d.parentId).map((d) => d.parentId as string))
    // 카드: 부모가 있는 문서 전부 + 최상위 문서 중 자식이 없거나 본문이 있는 것(카테고리 글 자체도 읽을 수 있게)
    const articles = docs
      .filter((d) => d.parentId || !hasChildren.has(d.id) || d.excerpt.length > 0)
      .map((d) => {
        // 카테고리 = 최상위 조상
        let top = d
        while (top.parentId && byId.get(top.parentId)) top = byId.get(top.parentId)!
        const isRoot = top.id === d.id && !d.parentId
        return { ...d, categoryId: isRoot ? (hasChildren.has(d.id) ? d.id : '') : top.id, categoryName: isRoot ? (hasChildren.has(d.id) ? d.title : '일반') : top.title }
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    const categories = roots
      .filter((r) => hasChildren.has(r.id))
      .map((r) => ({ id: r.id, name: r.title, count: articles.filter((a) => a.categoryId === r.id).length }))
    return { categories, articles }
  }, [docs])

  const term = q.trim().toLowerCase()
  const shown = articles.filter((a) => (!tab || a.categoryId === tab) && (!term || `${a.title} ${a.excerpt}`.toLowerCase().includes(term)))
  const isNew = (iso: string) => Date.now() - new Date(iso).getTime() < 7 * 24 * 3600 * 1000

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-[26px] font-bold text-text-primary tracking-[-0.02em]">라이브러리</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="가이드 검색" className="w-56 pl-9 pr-3 h-10 rounded-xl bg-bg-card border border-transparent focus:border-action-primary/40 focus:outline-none text-[13px] text-text-primary placeholder:text-text-tertiary" />
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]" data-testid="library-tabs">
        <button onClick={() => setTab('')} className={`shrink-0 px-3.5 py-2 rounded-full text-[13px] font-medium transition-colors ${!tab ? 'bg-text-primary text-bg-card' : 'bg-bg-card text-text-secondary hover:text-text-primary'}`}>
          전체 <span className={!tab ? 'opacity-70' : 'text-text-tertiary'}>{articles.length}</span>
        </button>
        {categories.map((c) => (
          <button key={c.id} onClick={() => setTab(c.id)} className={`shrink-0 px-3.5 py-2 rounded-full text-[13px] font-medium transition-colors ${tab === c.id ? 'bg-text-primary text-bg-card' : 'bg-bg-card text-text-secondary hover:text-text-primary'}`}>
            {c.name} <span className={tab === c.id ? 'opacity-70' : 'text-text-tertiary'}>{c.count}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl bg-bg-card py-16 text-center">
          <BookOpen className="w-8 h-8 mx-auto text-text-tertiary" strokeWidth={1.5} />
          <p className="mt-2 text-[13px] text-text-secondary">아직 올라온 가이드가 없어요.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-5 gap-y-8" data-testid="library-gallery">
          {shown.map((a, i) => (
            <li key={a.id}>
              <Link href={cp(`/library/${a.id}`)} className="group block transition-transform duration-200 hover:-translate-y-0.5">
                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden ring-1 ring-black/[0.04] dark:ring-white/10" style={{ background: a.thumbnail ? '#f2f4f6' : PASTELS[i % PASTELS.length] }}>
                  {isNew(a.updatedAt) && <span className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-full bg-action-primary text-white text-[10px] font-bold">NEW</span>}
                  {a.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" loading="lazy" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center gap-2">
                      <span className="text-[28px]">{a.emoji || '📘'}</span>
                      <span className="text-[18px] font-bold text-[#333d4b]/80">혜택연구소</span>
                    </div>
                  )}
                </div>
                <p className="mt-3 text-[12px] font-medium text-action-primary">{a.categoryName}</p>
                <p className="mt-1 text-[16px] font-semibold text-text-primary leading-snug line-clamp-2">{a.title}</p>
                {a.excerpt && <p className="mt-1 text-[13px] text-text-secondary line-clamp-1">{a.excerpt}</p>}
                <p className="mt-1.5 text-[12px] text-text-tertiary">{dateLabel(a.updatedAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
