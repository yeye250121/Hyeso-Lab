'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react'
import api from '@/lib/admin/api'
import { formatDateTime } from '@/components/admin/labels'

// 문서 한 장. 읽기 모드는 서버가 준 HTML 을 그대로 그리고(편집기 안 불러옴),
// 편집을 눌렀을 때만 TipTap 을 동적으로 불러온다.
const TipTapEditor = dynamic(() => import('@/components/admin/TipTapEditor'), {
  ssr: false,
  loading: () => <div className="rounded-button bg-bg-primary h-[400px] animate-pulse" />,
})

type Doc = {
  id: string
  parentId: string | null
  title: string
  emoji: string | null
  content: string
  isPublished: boolean
  updatedAt: string
  updatedBy: string | null
}

export default function DocView({ id, onChanged }: { id: string; onChanged: () => void }) {
  const router = useRouter()
  const params = useSearchParams()
  const [doc, setDoc] = useState<Doc | null>(null)
  const [canEdit, setCanEdit] = useState(false)
  const [editing, setEditing] = useState(params.get('edit') === '1')
  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const articleRef = useRef<HTMLElement>(null)
  const [toc, setToc] = useState<{ id: string; text: string; level: number }[]>([])

  useEffect(() => {
    setNotFound(false)
    api
      .get(`/admin/library/${id}`)
      .then((res) => {
        setDoc(res.data.doc)
        setCanEdit(res.data.canEdit)
        setTitle(res.data.doc.title)
        setEmoji(res.data.doc.emoji ?? '')
        setContent(res.data.doc.content)
      })
      .catch(() => setNotFound(true))
  }, [id])

  // 읽기 모드 목차: h1~h3 에 id 를 붙여 모은다
  useEffect(() => {
    if (editing || !articleRef.current) return
    const hs = Array.from(articleRef.current.querySelectorAll<HTMLElement>('h1, h2, h3'))
    setToc(
      hs.map((h, i) => {
        if (!h.id) h.id = `h-${i}`
        return { id: h.id, text: h.textContent ?? '', level: Number(h.tagName[1]) }
      })
    )
  }, [doc, editing])

  const save = useCallback(
    async (extra: Record<string, unknown> = {}) => {
      if (!doc) return
      setSaving(true)
      try {
        const res = await api.patch(`/admin/library/${doc.id}`, { title: title.trim() || '제목 없음', emoji: emoji.trim() || null, content, ...extra })
        setDoc(res.data.doc)
        setSavedAt(new Date().toISOString())
        onChanged()
      } finally {
        setSaving(false)
      }
    },
    [doc, title, emoji, content, onChanged]
  )

  const finishEditing = async () => {
    await save()
    setEditing(false)
    router.replace(`/admin/library/${id}`)
  }

  const togglePublish = async () => {
    if (!doc) return
    await save({ isPublished: !doc.isPublished })
  }

  const remove = async () => {
    if (!doc) return
    if (!confirm('이 문서와 하위 문서를 모두 삭제할까요? 되돌릴 수 없어요.')) return
    await api.delete(`/admin/library/${doc.id}`)
    onChanged()
    router.replace('/admin/library')
  }

  const hasToc = useMemo(() => toc.length >= 2, [toc])

  if (notFound) return <div className="rounded-card bg-bg-card px-6 py-16 text-center text-small text-text-secondary">문서를 찾을 수 없어요.</div>
  if (!doc) return <div className="rounded-card bg-bg-card h-[320px] animate-pulse" />

  return (
    <div className={hasToc && !editing ? 'xl:grid xl:grid-cols-[minmax(0,1fr)_200px] xl:gap-6 xl:items-start' : ''}>
      <div className="rounded-card bg-bg-card">
        {/* 상단 바 */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border">
          <p className="text-xs text-text-secondary truncate">
            {doc.updatedBy ? `${doc.updatedBy} · ` : ''}{formatDateTime(doc.updatedAt)} 수정
            {!doc.isPublished && <span className="ml-2 px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 text-[10px] font-medium">초안 · 운영진만 보임</span>}
          </p>
          {canEdit && (
            <div className="flex items-center gap-1.5 shrink-0">
              {editing ? (
                <>
                  <span className="text-xs text-text-tertiary mr-1">{saving ? '저장 중…' : savedAt ? '저장됨' : ''}</span>
                  <button type="button" onClick={finishEditing} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 rounded-button bg-action-primary text-white text-small font-medium disabled:opacity-50">
                    <Check className="w-4 h-4" /> 완료
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={togglePublish} title={doc.isPublished ? '초안으로 전환' : '발행'} className="p-2 rounded-button text-text-secondary hover:text-text-primary hover:bg-bg-primary">
                    {doc.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button type="button" onClick={remove} title="삭제" className="p-2 rounded-button text-text-secondary hover:text-red-500 hover:bg-bg-primary">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => setEditing(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-button border border-border text-small font-medium text-text-primary hover:bg-bg-primary">
                    <Pencil className="w-4 h-4" /> 편집
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* 제목 */}
        <div className="px-5 pt-6 pb-2 lg:px-8">
          {editing ? (
            <div className="flex items-start gap-2">
              <input value={emoji} onChange={(e) => setEmoji(e.target.value.slice(0, 4))} placeholder="🙂" className="w-12 h-12 text-center text-2xl rounded-button bg-bg-primary border border-border" aria-label="이모지" />
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => save()}
                placeholder="제목"
                className="flex-1 h-12 px-3 text-2xl font-bold rounded-button bg-bg-primary border border-border text-text-primary"
              />
            </div>
          ) : (
            <h1 className="text-[28px] font-bold text-text-primary leading-snug">
              {doc.emoji && <span className="mr-2">{doc.emoji}</span>}
              {doc.title}
            </h1>
          )}
        </div>

        {/* 본문 */}
        <div className="px-5 pb-8 lg:px-8">
          {editing ? (
            <div className="rounded-button border border-border overflow-hidden">
              <TipTapEditor content={content} onChange={setContent} />
            </div>
          ) : doc.content.trim() ? (
            <article ref={articleRef} className="library-doc" data-testid="library-doc" dangerouslySetInnerHTML={{ __html: doc.content }} />
          ) : (
            <p className="py-10 text-center text-small text-text-tertiary">아직 내용이 없어요.{canEdit ? ' 편집을 눌러 작성하세요.' : ''}</p>
          )}
        </div>
      </div>

      {hasToc && !editing && (
        <nav className="hidden xl:block sticky top-6 text-xs">
          <p className="mb-2 font-semibold text-text-secondary">목차</p>
          <ul className="space-y-1 border-l border-border">
            {toc.map((t) => (
              <li key={t.id} style={{ paddingLeft: `${(t.level - 1) * 10 + 10}px` }}>
                <a href={`#${t.id}`} className="block py-0.5 text-text-secondary hover:text-text-primary truncate">{t.text}</a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}
